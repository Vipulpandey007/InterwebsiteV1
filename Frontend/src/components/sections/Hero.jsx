import { useNavigate } from "react-router-dom";
import { BackgroundBeamsWithCollision } from "../ui/background-beams-with-collision";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <BackgroundBeamsWithCollision>
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Welcome to
            <span className="block text-indigo-600 mt-2">
              Gossner Intermediate College, Ranchi
            </span>
          </h1>

          {/* Description */}
          <p className="text-gray-800 mb-8 max-w-4xl mx-auto text-sm sm:text-base text-justify">
            Gossner College was established in November, 1971 by our Founder
            Principal Rt. Reverend Dr. Nirmal Minz. Gossner College is a
            Minority College, affiliated to Ranchi University and is managed by
            Gossner Evangelical Lutheran Church (GELC) of Chotanagpur and Assam.{" "}
            <span>
              Our mission is to provide the vista of university education to the
              deserving students coming from socially, economically backward and
              underprivileged communities of this region, particularly the
              Scheduled Tribes, Scheduled Castes and other Backward Communities.
              Preference is given to students from these communities. However,
              since the college is situated in the heart of Ranchi (Jharkhand,
              India), students of other communities and regions may also apply.
            </span>
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => navigate("/signup")}
              className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Apply Now
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 transition"
            >
              Student Login
            </button>
          </div>
        </div>
      </section>
    </BackgroundBeamsWithCollision>
  );
};

export default Hero;
