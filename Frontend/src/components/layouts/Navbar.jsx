import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "About", link: "#about" },
    { label: "Admission", link: "#admission" },
    { label: "Contact", link: "#contact" },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              GIC
            </div>
            <span className="text-xl font-bold">
              Gossner Intermediate College
            </span>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.link}
                className="hover:text-indigo-600"
              >
                {item.label}
              </a>
            ))}

            <button
              onClick={() => navigate("/login")}
              className="text-indigo-600"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              Apply Now
            </button>
          </div>

          {/* Mobile */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          {navLinks.map((item) => (
            <a key={item.label} href={item.link} className="block">
              {item.label}
            </a>
          ))}

          <button onClick={() => navigate("/login")} className="block">
            Login
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
