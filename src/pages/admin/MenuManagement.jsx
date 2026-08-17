import { useEffect, useState } from "react";
import API from "../../services/interceptor";

/* =========================
   BUILD TREE FROM FLAT LIST
========================= */
function buildTree(menus) {
    const map = {};
    const tree = [];

    menus.forEach(m => {
        map[m.id] = { ...m, children: [] };
    });

    menus.forEach(m => {
        if (m.parent_id) {
            if (map[m.parent_id]) {
                map[m.parent_id].children.push(map[m.id]);
            }
        } else {
            tree.push(map[m.id]);
        }
    });

    return tree;
}

/* =========================
   TOGGLE LOGIC (FIXED)
========================= */
function toggleMenu(tree, id) {

    function update(nodes) {
        return nodes.map(node => {

            // CLICKED NODE
            if (node.id === id) {
                const newChecked = !node.checked;

                return {
                    ...node,
                    checked: newChecked,
                    children: updateAllChildren(node.children, newChecked)
                };
            }

            // HANDLE CHILDREN
            if (node.children.length > 0) {
                const updatedChildren = update(node.children);

                const allChildChecked = updatedChildren.every(c => c.checked);

                // 🚨 FORCE CHILDREN FALSE IF PARENT FALSE
                if (!allChildChecked) {
                    return {
                        ...node,
                        checked: false,
                        children: updateAllChildren(updatedChildren, false)
                    };
                }

                return {
                    ...node,
                    checked: true,
                    children: updatedChildren
                };
            }

            return node;
        });
    }

    function updateAllChildren(children, value) {
        return children.map(child => ({
            ...child,
            checked: value,
            children: updateAllChildren(child.children, value)
        }));
    }

    return update(tree);
}

/* =========================
   FLATTEN TREE (FOR SAVE)
========================= */
function flattenTree(tree) {
    let result = [];

    tree.forEach(node => {
        if (node.checked) result.push(node.id);

        if (node.children.length > 0) {
            result = result.concat(flattenTree(node.children));
        }
    });

    return result;
}

/* =========================
   MENU ITEM UI
========================= */
function MenuItem({ menu, onToggle, level = 0, parentChecked = true }) {

    const isDisabled = !parentChecked;

    return (
        <div className="mb-1">

            <div
                className={`flex items-center gap-2 px-3 py-2 rounded-md 
        ${isDisabled ? "opacity-50" : "hover:bg-gray-100"}`}
                style={{ marginLeft: `${level * 20}px` }}
            >
                {/* Checkbox */}
                <input
                    type="checkbox"
                    checked={menu.checked || false}
                    disabled={isDisabled}
                    onChange={() => onToggle(menu.id)}
                    className="w-4 h-4 cursor-pointer"
                />

                {/* Label */}
                <span className="text-sm font-medium">
                    {menu.name}
                </span>
            </div>

            {/* Children */}
            {menu.children?.length > 0 &&
                menu.children.map(child => (
                    <MenuItem
                        key={child.id}
                        menu={child}
                        onToggle={onToggle}
                        level={level + 1}
                        parentChecked={menu.checked}
                    />
                ))}
        </div>
    );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function MenuManagement() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [menus, setMenus] = useState([]);

    /* LOAD USERS */
    useEffect(() => {
        API
            .get("/auth/users")
            .then(res => setUsers(res.data));
    }, []);

    /* LOAD MENUS */
    useEffect(() => {
        if (!selectedUser) return;

        API
            .get(`/auth/menu/by-user/${selectedUser}`)
            .then(res => {
                const tree = buildTree(res.data);
                setMenus(tree);
            });
    }, [selectedUser]);

    /* TOGGLE */
    const handleToggle = (id) => {
        setMenus(prev => toggleMenu(prev, id));
    };

    /* SAVE */
    const handleSave = async () => {
        const selectedIds = flattenTree(menus);

        await API.post(
            "/auth/menu/assign-user",
            {
                userId: selectedUser,
                menuIds: selectedIds
            }
        );

        alert("Menus updated");
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">

            {/* TITLE */}
            <h2 className="text-xl font-semibold mb-4">
                Menu Management
            </h2>

            {/* USER SELECT */}
            <select
                className="border p-2 rounded-md mb-4"
                onChange={(e) => setSelectedUser(e.target.value)}
            >
                <option value="">Select User</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>
                        {u.name} ({u.role?.name})
                    </option>
                ))}
            </select>

            {/* MENU TREE */}
            <div className="bg-white shadow rounded-lg p-4 max-h-[500px] overflow-auto">
                {menus.length === 0 ? (
                    <p className="text-gray-500">No menus found</p>
                ) : (
                    menus.map(menu => (
                        <MenuItem
                            key={menu.id}
                            menu={menu}
                            onToggle={handleToggle}
                        />
                    ))
                )}
            </div>

            {/* SAVE BUTTON */}
            <button
                onClick={handleSave}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md"
            >
                Save
            </button>

        </div>
    );
}
