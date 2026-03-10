import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "About", link: "#about" },
    { label: "Admission", link: "#admission" },
    { label: "Contact", link: "#contact" },
  ];

  const handleNavigation = (link) => {
    setMenuOpen(false);
    window.location.href = link;
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur py-3 px-3 sm:px-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 border rounded-full shadow-lg bg-[#1f2933] border-gray-200 text-white">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/logo.svg"
            alt="Gossner Intermediate College"
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
          />

          {/* Hide long text on very small devices */}
          <span className="hidden sm:block font-semibold text-sm md:text-[22px]">
            Gossner Intermediate College, Ranchi
          </span>
        </div>

        {/* Desktop Links */}

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search */}
          {/* <button className="p-2 text-gray-500 hover:text-black">
            <Search size={20} />
          </button> */}

          <div className="hidden md:flex space-x-6">
            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.link)}
                className="text-white hover:text-black transition"
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* Login Button (Desktop) */}
          <button
            onClick={() => navigate("/login")}
            className="hidden md:flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
          >
            Log in
          </button>

          {/* Apply Button (Desktop) */}
          <button
            onClick={() => navigate("/signup")}
            className="hidden md:flex bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Sign Up
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-500 hover:text-black"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 bg-white shadow-xl rounded-xl p-5 space-y-4 max-w-7xl mx-auto">
          {navLinks.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.link)}
              className="block w-full text-left text-gray-700 hover:text-indigo-600 text-lg"
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={() => {
              setMenuOpen(false);
              navigate("/login");
            }}
            className="block w-full text-left text-gray-700"
          >
            Login
          </button>

          <button
            onClick={() => {
              setMenuOpen(false);
              navigate("/signup");
            }}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg"
          >
            Apply Now
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
