import { pool } from "../database/pool.js";

const requestSelect = `
  SELECT sr.id,sr.request_code,sr.service_slug,sr.status,sr.payload,sr.pricing_snapshot,
         sr.submitted_at,sr.created_at,sr.updated_at,
         sc.name service_name,sc.category service_category,sc.config service_config,
         (SELECT COUNT(*)::int FROM service_request_documents document
           WHERE document.request_id=sr.id) document_count,
         u.id client_id,u.name client_name,u.email client_email,u.user_code client_code,
         a.id assignment_id,a.agent_id,a.instructions assignment_instructions,
         a.due_date assignment_due_date,a.status assignment_status,
         a.started_at,a.completed_at,a.completion_notes,
         agent.name agent_name,agent.email agent_email,agent.user_code agent_code
    FROM service_requests sr
    JOIN service_catalog sc ON sc.slug=sr.service_slug
    JOIN users u ON u.id=sr.user_id
    LEFT JOIN service_request_assignments a ON a.request_id=sr.id
    LEFT JOIN users agent ON agent.id=a.agent_id`;

export async function listClientRequests(userId) {
  const result = await pool.query(
    `${requestSelect} WHERE sr.user_id=$1 AND sr.status <> 'DRAFT' ORDER BY sr.updated_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function listAdminWorkflowRequests({ search = "", status = "" } = {}) {
  const values = [];
  const clauses = ["sr.status <> 'DRAFT'"];
  if (search) {
    values.push(`%${search}%`);
    clauses.push(`(sr.request_code ILIKE $${values.length} OR u.name ILIKE $${values.length}
      OR u.email ILIKE $${values.length} OR sc.name ILIKE $${values.length})`);
  }
  if (status) {
    values.push(status);
    clauses.push(`sr.status=$${values.length}`);
  }
  const result = await pool.query(
    `${requestSelect} WHERE ${clauses.join(" AND ")} ORDER BY sr.updated_at DESC`,
    values
  );
  return result.rows;
}

export async function listAgentTasks(agentId) {
  const result = await pool.query(
    `${requestSelect} WHERE a.agent_id=$1 ORDER BY a.updated_at DESC`,
    [agentId]
  );
  return result.rows;
}

export async function findWorkflowRequest(requestId, { clientId, agentId } = {}) {
  const values = [requestId];
  const clauses = ["sr.id=$1"];
  if (clientId) {
    values.push(clientId);
    clauses.push(`sr.user_id=$${values.length}`);
  }
  if (agentId) {
    values.push(agentId);
    clauses.push(`a.agent_id=$${values.length}`);
  }
  const result = await pool.query(
    `${requestSelect} WHERE ${clauses.join(" AND ")}`,
    values
  );
  return result.rows[0] || null;
}

export async function getWorkflowRelations(requestId) {
  const [documents, clarifications, clarificationDocuments, events, workDocuments, transactions] = await Promise.all([
    pool.query(
      `SELECT id,document_key,original_name,mime_type,size_bytes,uploaded_at
         FROM service_request_documents WHERE request_id=$1 ORDER BY uploaded_at`, [requestId]
    ),
    pool.query(
      `SELECT c.*,u.name requested_by_name
         FROM service_request_clarifications c JOIN users u ON u.id=c.requested_by
        WHERE c.request_id=$1 ORDER BY c.created_at DESC`, [requestId]
    ),
    pool.query(
      `SELECT d.* FROM clarification_documents d
         JOIN service_request_clarifications c ON c.id=d.clarification_id
        WHERE c.request_id=$1 ORDER BY d.uploaded_at`, [requestId]
    ),
    pool.query(
      `SELECT e.*,u.name actor_name,r.name actor_role
         FROM service_request_events e
         LEFT JOIN users u ON u.id=e.actor_id
         LEFT JOIN roles r ON r.id=u.role_id
        WHERE e.request_id=$1 ORDER BY e.created_at`, [requestId]
    ),
    pool.query(
      `SELECT d.* FROM agent_work_documents d
         JOIN service_request_assignments a ON a.id=d.assignment_id
        WHERE a.request_id=$1 ORDER BY d.uploaded_at`, [requestId]
    ),
    pool.query(
      `SELECT * FROM financial_transactions WHERE service_request_id=$1 ORDER BY created_at`,
      [requestId]
    )
  ]);
  return {
    documents: documents.rows,
    clarifications: clarifications.rows.map((clarification) => ({
      ...clarification,
      documents: clarificationDocuments.rows.filter(
        (document) => document.clarification_id === clarification.id
      )
    })),
    events: events.rows,
    workDocuments: workDocuments.rows,
    transactions: transactions.rows
  };
}

export async function listAgents() {
  const result = await pool.query(
    `SELECT u.id,u.name,u.email,u.user_code,
            COUNT(a.id) FILTER (WHERE a.status <> 'COMPLETED')::int active_tasks
       FROM users u JOIN roles r ON r.id=u.role_id
       LEFT JOIN service_request_assignments a ON a.agent_id=u.id
      WHERE r.name='AGENT' AND u.is_active=TRUE
      GROUP BY u.id ORDER BY active_tasks,u.name`
  );
  return result.rows;
}

async function notifyRole(client, role, requestId, type, title, message) {
  await client.query(
    `INSERT INTO notifications(user_id,request_id,type,title,message)
     SELECT u.id,$1,$2,$3,$4 FROM users u JOIN roles r ON r.id=u.role_id
      WHERE r.name=$5 AND u.is_active=TRUE`,
    [requestId, type, title, message, role]
  );
}

export async function createClarification({
  requestId, adminId, comments, requestedDocuments, dueDate
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const request = await client.query(
      `SELECT id,user_id,request_code,status FROM service_requests
        WHERE id=$1 AND status IN ('SUBMITTED','UNDER_REVIEW','DOCUMENTS_RESUBMITTED','ADMIN_REVIEW')
        FOR UPDATE`, [requestId]
    );
    if (!request.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    const clarification = await client.query(
      `INSERT INTO service_request_clarifications(
        request_id,requested_by,comments,requested_documents,due_date
      ) VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [requestId, adminId, comments, JSON.stringify(requestedDocuments), dueDate || null]
    );
    await client.query(
      `UPDATE service_requests SET status='ADDITIONAL_DOCUMENTS_REQUESTED',updated_at=NOW() WHERE id=$1`,
      [requestId]
    );
    await client.query(
      `INSERT INTO service_request_events(request_id,actor_id,status,title,comments,metadata)
       VALUES($1,$2,'ADDITIONAL_DOCUMENTS_REQUESTED','Additional documents requested',$3,$4)`,
      [requestId, adminId, comments, { requestedDocuments, dueDate: dueDate || null }]
    );
    await client.query(
      `INSERT INTO notifications(user_id,request_id,type,title,message)
       VALUES($1,$2,'CLARIFICATION_REQUESTED','Additional documents required',$3)`,
      [request.rows[0].user_id, requestId, comments]
    );
    await client.query("COMMIT");
    return clarification.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateAdminRequestStatus({
  requestId, adminId, status, comments, allowedFrom
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const request = await client.query(
      `SELECT id,user_id,status FROM service_requests
        WHERE id=$1 AND status=ANY($2::varchar[]) FOR UPDATE`,
      [requestId, allowedFrom]
    );
    if (!request.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    const previousStatus = request.rows[0].status;
    const updated = await client.query(
      `UPDATE service_requests SET status=$2,updated_at=NOW()
        WHERE id=$1 RETURNING *`,
      [requestId, status]
    );
    await client.query(
      `INSERT INTO service_request_events(
        request_id,actor_id,status,title,comments,metadata
      ) VALUES($1,$2,$3,$4,$5,$6)`,
      [
        requestId,
        adminId,
        status,
        "Application status updated",
        comments || "",
        { previousStatus, newStatus: status }
      ]
    );
    await client.query(
      `INSERT INTO notifications(user_id,request_id,type,title,message)
       VALUES($1,$2,'STATUS_UPDATED','Application status updated',$3)`,
      [
        request.rows[0].user_id,
        requestId,
        comments || `Your application status changed from ${previousStatus} to ${status}.`
      ]
    );
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findClientClarification(clarificationId, userId) {
  const result = await pool.query(
    `SELECT c.*,sr.user_id,sr.status request_status FROM service_request_clarifications c
       JOIN service_requests sr ON sr.id=c.request_id
      WHERE c.id=$1 AND sr.user_id=$2`, [clarificationId, userId]
  );
  return result.rows[0] || null;
}

export async function addClarificationDocument({
  clarificationId, userId, documentLabel, originalName, storedName, mimeType, size
}) {
  const result = await pool.query(
    `INSERT INTO clarification_documents(
      clarification_id,uploaded_by,document_label,original_name,stored_name,mime_type,size_bytes
    ) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [clarificationId, userId, documentLabel, originalName, storedName, mimeType, size]
  );
  return result.rows[0];
}

export async function resubmitClarification({ clarificationId, userId, comments = "" }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const clarification = await client.query(
      `SELECT c.*,sr.user_id FROM service_request_clarifications c
       JOIN service_requests sr ON sr.id=c.request_id
       WHERE c.id=$1 AND sr.user_id=$2 AND c.status='OPEN' FOR UPDATE`,
      [clarificationId, userId]
    );
    if (!clarification.rows[0]) return null;
    const docs = await client.query(
      "SELECT COUNT(*)::int count FROM clarification_documents WHERE clarification_id=$1",
      [clarificationId]
    );
    if (!docs.rows[0].count) {
      const error = new Error("Upload at least one requested document");
      error.code = "DOCUMENT_REQUIRED";
      throw error;
    }
    const requestId = clarification.rows[0].request_id;
    await client.query(
      `UPDATE service_request_clarifications SET status='RESUBMITTED',
       resubmitted_at=NOW(),updated_at=NOW() WHERE id=$1`, [clarificationId]
    );
    await client.query(
      `UPDATE service_requests SET status='DOCUMENTS_RESUBMITTED',updated_at=NOW() WHERE id=$1`,
      [requestId]
    );
    await client.query(
      `INSERT INTO service_request_events(request_id,actor_id,status,title,comments)
       VALUES($1,$2,'DOCUMENTS_RESUBMITTED','Requested documents resubmitted',$3)`,
      [requestId, userId, comments]
    );
    await notifyRole(client, "ADMIN", requestId, "DOCUMENTS_RESUBMITTED",
      "Client resubmitted documents", "Requested documents are ready for review.");
    await client.query("COMMIT");
    return { requestId, status: "DOCUMENTS_RESUBMITTED" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function assignRequest({ requestId, adminId, agentId, instructions, dueDate }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const agent = await client.query(
      `SELECT u.id,u.name FROM users u JOIN roles r ON r.id=u.role_id
        WHERE u.id=$1 AND r.name='AGENT' AND u.is_active=TRUE`, [agentId]
    );
    if (!agent.rows[0]) return null;
    const request = await client.query(
      `SELECT id,user_id FROM service_requests
        WHERE id=$1 AND status IN ('SUBMITTED','UNDER_REVIEW','DOCUMENTS_RESUBMITTED','ADMIN_REVIEW')
        FOR UPDATE`, [requestId]
    );
    if (!request.rows[0]) return null;
    const assignment = await client.query(
      `INSERT INTO service_request_assignments(
        request_id,agent_id,assigned_by,instructions,due_date
      ) VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(request_id) DO UPDATE SET agent_id=EXCLUDED.agent_id,
        assigned_by=EXCLUDED.assigned_by,instructions=EXCLUDED.instructions,
        due_date=EXCLUDED.due_date,status='ASSIGNED',started_at=NULL,completed_at=NULL,
        completion_notes='',updated_at=NOW()
      RETURNING *`,
      [requestId, agentId, adminId, instructions || "", dueDate || null]
    );
    await client.query(
      `UPDATE service_requests SET status='ASSIGNED_TO_AGENT',updated_at=NOW() WHERE id=$1`,
      [requestId]
    );
    await client.query(
      `INSERT INTO service_request_events(request_id,actor_id,status,title,comments,metadata)
       VALUES($1,$2,'ASSIGNED_TO_AGENT','Assigned to agent',$3,$4)`,
      [requestId, adminId, instructions || "", { agentId, agentName: agent.rows[0].name, dueDate: dueDate || null }]
    );
    await client.query(
      `INSERT INTO notifications(user_id,request_id,type,title,message)
       VALUES($1,$2,'TASK_ASSIGNED','New service request assigned',$3)`,
      [agentId, requestId, instructions || "A new request was assigned to you."]
    );
    await client.query(
      `INSERT INTO notifications(user_id,request_id,type,title,message)
       VALUES($1,$2,'REQUEST_ASSIGNED','Request assigned to an agent',$3)`,
      [request.rows[0].user_id, requestId, `Assigned to ${agent.rows[0].name}`]
    );
    await client.query("COMMIT");
    return assignment.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function startRequestReview({ requestId, adminId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE service_requests SET status='UNDER_REVIEW',updated_at=NOW()
        WHERE id=$1 AND status IN ('SUBMITTED','DOCUMENTS_RESUBMITTED') RETURNING *`,
      [requestId]
    );
    if (!result.rows[0]) return null;
    await client.query(
      `UPDATE service_request_clarifications SET status='ACCEPTED',updated_at=NOW()
        WHERE request_id=$1 AND status='RESUBMITTED'`, [requestId]
    );
    await client.query(
      `INSERT INTO service_request_events(request_id,actor_id,status,title)
       VALUES($1,$2,'UNDER_REVIEW','Admin started application review')`, [requestId, adminId]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function startAgentTask({ requestId, agentId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const assignment = await client.query(
      `UPDATE service_request_assignments SET status='IN_PROGRESS',
       started_at=COALESCE(started_at,NOW()),updated_at=NOW()
       WHERE request_id=$1 AND agent_id=$2 AND status='ASSIGNED' RETURNING *`,
      [requestId, agentId]
    );
    if (!assignment.rows[0]) return null;
    await client.query(
      `UPDATE service_requests SET status='IN_PROGRESS',updated_at=NOW() WHERE id=$1`, [requestId]
    );
    await client.query(
      `INSERT INTO service_request_events(request_id,actor_id,status,title)
       VALUES($1,$2,'IN_PROGRESS','Agent started processing')`, [requestId, agentId]
    );
    await client.query("COMMIT");
    return assignment.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findAgentAssignment(requestId, agentId) {
  const result = await pool.query(
    `SELECT * FROM service_request_assignments WHERE request_id=$1 AND agent_id=$2`,
    [requestId, agentId]
  );
  return result.rows[0] || null;
}

export async function addAgentWorkDocument({
  assignmentId, agentId, originalName, storedName, mimeType, size
}) {
  const result = await pool.query(
    `INSERT INTO agent_work_documents(
      assignment_id,uploaded_by,original_name,stored_name,mime_type,size_bytes
    ) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
    [assignmentId, agentId, originalName, storedName, mimeType, size]
  );
  return result.rows[0];
}

export async function completeAgentTask({ requestId, agentId, notes }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const assignment = await client.query(
      `UPDATE service_request_assignments SET status='COMPLETED',completion_notes=$3,
       completed_at=NOW(),updated_at=NOW()
       WHERE request_id=$1 AND agent_id=$2 AND status='IN_PROGRESS' RETURNING *`,
      [requestId, agentId, notes || ""]
    );
    if (!assignment.rows[0]) return null;
    await client.query(
      `UPDATE service_requests SET status='AGENT_COMPLETED',updated_at=NOW() WHERE id=$1`, [requestId]
    );
    await client.query(
      `INSERT INTO service_request_events(request_id,actor_id,status,title,comments)
       VALUES($1,$2,'AGENT_COMPLETED','Agent completed assigned work',$3)`,
      [requestId, agentId, notes || ""]
    );
    await notifyRole(client, "ADMIN", requestId, "AGENT_COMPLETED",
      "Agent work is ready for review", "The assigned agent marked this request complete.");
    await client.query("COMMIT");
    return assignment.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setAdminReview({ requestId, adminId }) {
  const result = await pool.query(
    `UPDATE service_requests SET status='ADMIN_REVIEW',updated_at=NOW()
      WHERE id=$1 AND status='AGENT_COMPLETED' RETURNING *`, [requestId]
  );
  if (result.rows[0]) {
    await pool.query(
      `INSERT INTO service_request_events(request_id,actor_id,status,title)
       VALUES($1,$2,'ADMIN_REVIEW','Admin reviewing completed work')`, [requestId, adminId]
    );
  }
  return result.rows[0] || null;
}

export async function finalizeRequest({ requestId, adminId, decision, comments }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const allowed = decision === "REJECTED"
      ? ["SUBMITTED", "UNDER_REVIEW", "DOCUMENTS_RESUBMITTED", "ADMIN_REVIEW", "AGENT_COMPLETED"]
      : ["ADMIN_REVIEW", "AGENT_COMPLETED"];
    const request = await client.query(
      `SELECT * FROM service_requests WHERE id=$1 AND status=ANY($2::varchar[]) FOR UPDATE`,
      [requestId, allowed]
    );
    if (!request.rows[0]) return null;
    const status = decision === "REJECTED" ? "REJECTED" : "COMPLETED";
    if (status === "COMPLETED") {
      await client.query(
        `INSERT INTO service_request_events(request_id,actor_id,status,title,comments)
         VALUES($1,$2,'APPROVED','Admin approved agent work',$3)`,
        [requestId, adminId, comments || ""]
      );
    }
    await client.query(
      `UPDATE service_requests SET status=$2,updated_at=NOW() WHERE id=$1`, [requestId, status]
    );
    await client.query(
      `INSERT INTO service_request_events(request_id,actor_id,status,title,comments)
       VALUES($1,$2,$3,$4,$5)`,
      [requestId, adminId, status,
        status === "COMPLETED" ? "Request completed" : "Request rejected", comments || ""]
    );
    await client.query(
      `INSERT INTO notifications(user_id,request_id,type,title,message)
       VALUES($1,$2,$3,$4,$5)`,
      [request.rows[0].user_id, requestId, status,
        status === "COMPLETED" ? "Service request completed" : "Service request rejected",
        comments || (status === "COMPLETED" ? "Your request has been approved and completed." : "Please contact support for details.")]
    );
    await client.query("COMMIT");
    return { id: requestId, status };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listNotifications(userId) {
  const result = await pool.query(
    `SELECT n.*,sr.request_code FROM notifications n
     LEFT JOIN service_requests sr ON sr.id=n.request_id
     WHERE n.user_id=$1 ORDER BY n.created_at DESC LIMIT 50`, [userId]
  );
  return result.rows;
}

export async function markNotificationRead(notificationId, userId) {
  const result = await pool.query(
    `UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2 RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
}

export async function findWorkflowFile({ requestId, fileId, kind, clientId, agentId }) {
  const ownership = clientId
    ? { sql: "AND sr.user_id=$3", value: clientId }
    : agentId
      ? { sql: "AND a.agent_id=$3", value: agentId }
      : { sql: "", value: null };
  let sql;
  if (kind === "original") {
    sql = `SELECT d.*,sr.service_slug FROM service_request_documents d
      JOIN service_requests sr ON sr.id=d.request_id
      LEFT JOIN service_request_assignments a ON a.request_id=sr.id
      WHERE sr.id=$1 AND d.id=$2 ${ownership.sql}`;
  } else if (kind === "clarification") {
    sql = `SELECT d.*,sr.service_slug FROM clarification_documents d
      JOIN service_request_clarifications c ON c.id=d.clarification_id
      JOIN service_requests sr ON sr.id=c.request_id
      LEFT JOIN service_request_assignments a ON a.request_id=sr.id
      WHERE sr.id=$1 AND d.id=$2 ${ownership.sql}`;
  } else if (kind === "output") {
    sql = `SELECT d.*,sr.service_slug FROM agent_work_documents d
      JOIN service_request_assignments a ON a.id=d.assignment_id
      JOIN service_requests sr ON sr.id=a.request_id
      WHERE sr.id=$1 AND d.id=$2 ${ownership.sql}`;
  } else {
    return null;
  }
  const values = ownership.value ? [requestId, fileId, ownership.value] : [requestId, fileId];
  const result = await pool.query(sql, values);
  return result.rows[0] || null;
}
