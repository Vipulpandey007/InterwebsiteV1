import { streams } from "../../constants/streamsData";

const Streams = () => {
  return (
    <section className="py-16" id="admission">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-10">
          Streams Available
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {streams.map((stream) => (
            <div
              key={stream.title}
              className="bg-white shadow-lg rounded-xl p-8 hover:shadow-xl transition"
            >
              <h3 className="text-2xl font-bold mb-2">{stream.title}</h3>
              <p className="text-gray-600">{stream.subjects}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Streams;
