import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#F5F9FF] font-sans">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
          <a href='/operator' className="flex items-center text-sm font-semibold text-[#0A5CFF] hover:text-[#0A5CFF]/80 transition-colors">
            <ArrowLeft size={18} className="mr-2" />
            Back
          </a>
          <h1 className="text-lg font-semibold text-[#0F1A2B]">Pricing & Plans</h1>
          <div className="w-36"></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <PlanCard title="Normal" price="KES 1,000/mo" features={["Document uploads","Operator dashboard","Customer notifications"]} linkToSettings />
          <PlanCard title="Advanced" price="KES 2,500/mo" features={["Everything in Normal","AI checks","Smart recommendations"]} linkToSettings />
          <PlanCard title="Enterprise" price="Custom" features={["Custom integrations","Priority support","SLA"]} linkToSettings />
        </div>

        <section className="mt-8 bg-white p-6 rounded-2xl border border-gray-200">
          <h2 className="text-lg font-semibold">How billing works</h2>
          <ul className="list-disc ml-6 mt-3 text-sm text-[#5B6B82] space-y-2">
            <li>Pricing is billed monthly in KES unless otherwise specified.</li>
            <li>Clicking "Choose plan" sends you to Settings → Account Details → Manage Billing to complete payment.</li>
            <li>No payment form is shown on this page — all payments occur in the billing management view.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function PlanCard({ title, price, features, linkToSettings }: { title: string; price: string; features: string[]; linkToSettings?: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-[0_8px_30px_rgba(15,26,43,0.04)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-sm text-[#5B6B82]">{price}</div>
      </div>
      <ul className="mt-4 text-sm text-[#5B6B82] list-disc ml-4 space-y-2">
        {features.map((f) => <li key={f}>{f}</li>)}
      </ul>
      <div className="mt-6">
        {linkToSettings ? (
          <Link to="/settings" className="inline-block w-full text-center bg-[#0A5CFF] text-white py-2 rounded-lg">Choose plan</Link>
        ) : (
          <button className="inline-block w-full bg-[#0A5CFF] text-white py-2 rounded-lg">Choose plan</button>
        )}
      </div>
    </div>
  );
}
