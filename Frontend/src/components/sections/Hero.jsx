import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-br from-indigo-50 to-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to
          <span className="block text-indigo-600">
            Gossner Intermediate College
          </span>
        </h1>

        <p className="text-gray-600 mb-8">
          Apply for admission to Science, Commerce and Arts streams for
          2026-2027 academic session.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/signup")}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg"
          >
            Apply Now
          </button>

          <button
            onClick={() => navigate("/login")}
            className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg"
          >
            Student Login
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
