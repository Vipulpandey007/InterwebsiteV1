const steps = [
  {
    id: 1,
    title: "Register",
    description: "Create account with mobile number and verify OTP",
  },
  {
    id: 2,
    title: "Fill Form",
    description: "Complete application form and upload documents",
  },
  {
    id: 3,
    title: "Pay Fee",
    description: "Pay application fee of ₹1,000 securely online",
  },
  {
    id: 4,
    title: "Get Admit Card",
    description: "Download your admit card after approval",
  },
];

const AdmissionProcess = () => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Admission Process
          </h2>
          <p className="text-lg text-gray-600">
            Follow these simple steps to apply
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className="bg-white rounded-xl p-6 shadow-md text-center hover:shadow-lg transition"
            >
              <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                {step.id}
              </div>

              <h3 className="font-bold text-lg mb-2">{step.title}</h3>

              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdmissionProcess;
