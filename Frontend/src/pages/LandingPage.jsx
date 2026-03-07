import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-white font-bold text-xl">
              Gossner Intermediate College
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-white hover:bg-white/20 px-4 py-2 rounded-lg transition"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="text-white hover:bg-white/20 px-4 py-2 rounded-lg transition"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate("/signup")}
                    className="bg-white text-primary-600 hover:bg-white/90 px-4 py-2 rounded-lg transition font-medium"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* College Name */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 drop-shadow-lg">
            Gossner Intermediate College, Ranchi
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            Empowering Future Leaders
          </p>

          {/* Admission Banner */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-12 max-w-3xl mx-auto mb-12 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl">🎓</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Admissions Open
            </h2>
            <p className="text-xl text-primary-600 font-semibold mb-8">
              Academic Year 2026-2027
            </p>

            {isAuthenticated ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg px-12 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/signup")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg px-12 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Apply Now - Sign Up
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-bold text-lg px-12 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Already Registered? Login
                </button>
              </div>
            )}
          </div>

          {/* Info Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Wide Range of Courses
              </h3>
              <p className="text-gray-600">
                Engineering, Commerce, Arts & more
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">👨‍🎓</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Experienced Faculty
              </h3>
              <p className="text-gray-600">Learn from industry experts</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                100% Placement
              </h3>
              <p className="text-gray-600">Career support & guidance</p>
            </div>
          </div> */}

          {/* Contact Info */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg inline-block">
            <div className="flex flex-col sm:flex-row gap-4 text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xl">📞</span>
                <span>+91-1234567890</span>
              </div>
              <div className="hidden sm:block">|</div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✉️</span>
                <span>admissions@college.edu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-white/80 pb-8">
        <p>&copy; 2026 Gossner College. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LandingPage;
