import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h3 className="text-lg font-bold mb-3">Gossner Intermediate College</h3>

        <p className="text-gray-400 mb-4">
          Providing quality education for a brighter future.
        </p>

        <button
          onClick={() => navigate("/admin/login")}
          className="text-sm text-gray-300 hover:text-white"
        >
          Admin Login
        </button>

        <p className="text-gray-500 text-sm mt-6">© 2026 GIC Ranchi</p>
      </div>
    </footer>
  );
};

export default Footer;
