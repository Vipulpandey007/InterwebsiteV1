import React from "react";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Jen S.",
    role: "Founder of XYZ",
    image: "https://i.pravatar.cc/150?img=32",
    text: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsa nostrum labore dolor facilis.",
  },
  {
    name: "Paul A.",
    role: "Founder of XYZ",
    image: "https://i.pravatar.cc/150?img=12",
    text: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ipsa nostrum labore dolor facilis.",
  },
  {
    name: "Jeff R.",
    role: "Founder of XYZ",
    image: "https://i.pravatar.cc/150?img=45",
    text: "Lorem ipsum dolor, sit amet consectetur adipisicing elit.",
  },
  {
    name: "Kevin K.",
    role: "Founder of XYZ",
    image: "https://i.pravatar.cc/150?img=33",
    text: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
  },
  {
    name: "Andrea B.",
    role: "Founder of XYZ",
    image: "https://i.pravatar.cc/150?img=20",
    text: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
  },
  {
    name: "Xavier C.",
    role: "Founder of XYZ",
    image: "https://i.pravatar.cc/150?img=51",
    text: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 w-32 h-full " />
      <div className="absolute right-0 top-0 w-32 h-full " />

      <div className="space-y-8">
        {[...Array(2)].map((_, row) => (
          <div
            key={row}
            className={`flex gap-6 w-max ${
              row % 2 === 0 ? "animate-scroll-left" : "animate-scroll-right"
            }`}
          >
            {[...testimonials, ...testimonials].map((item, i) => (
              <div
                key={i}
                className="flex items-center bg-[#0f172a] rounded-xl min-w-[420px] shadow-lg overflow-hidden"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-32 h-full object-cover"
                />

                <div className="p-6 text-left text-white relative">
                  <Quote className="absolute top-4 right-4 opacity-30" />

                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{item.role}</p>

                  <p className="text-gray-300 text-sm leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
