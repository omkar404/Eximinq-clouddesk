export default function ServiceCard({ service, onBook }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow border">
      <h2 className="text-lg font-semibold">{service.name}</h2>

      <p className="text-sm text-gray-500 mt-2">
        {service.description}
      </p>

      <div className="bg-gray-100 rounded-md p-2 mt-3 text-sm">
        SLA: {service.sla_hours} Hours
      </div>

      <div className="flex justify-between items-center mt-6">
        <p className="text-xl font-bold">
          {service.price} Credits
        </p>

        <button
          onClick={onBook}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}