import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const Pricing = () => {
  const navigate = useNavigate();

  const plans = {
    basic: {
      name: 'Basic',
      price: 'Free',
      features: [
        { text: '50 receipts per month', included: true },
        { text: 'AI extraction', included: true },
        { text: 'Blockchain verification', included: true },
        { text: 'IPFS storage', included: true },
        { text: 'Basic dashboard', included: true },
        { text: 'ZK-Range proofs', included: false },
        { text: 'Advanced reports', included: false },
        { text: 'API access', included: false },
        { text: 'Priority support', included: false },
      ],
    },
    pro: {
      name: 'Pro',
      price: '$99/month',
      popular: true,
      features: [
        { text: 'Unlimited receipts', included: true },
        { text: 'Enhanced AI extraction', included: true },
        { text: 'Priority blockchain verification', included: true },
        { text: 'Priority IPFS storage', included: true },
        { text: 'Advanced dashboard & analytics', included: true },
        { text: 'ZK-Range proofs', included: true, highlight: true },
        { text: 'Advanced reports (PDF, Excel, JSON)', included: true },
        { text: 'Full API access', included: true },
        { text: '24/7 priority support', included: true },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-primary-900">
      <Navbar />

      <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Choose Your Plan
            </h1>
            <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
              Start free and upgrade when you need advanced features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {Object.entries(plans).map(([key, plan]) => (
              <Card
                key={key}
                className={`relative ${
                  plan.popular ? 'border-2 border-accent-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-gradient-premium text-white rounded-full text-sm font-medium">
                      RECOMMENDED
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-5xl font-bold text-gradient-primary mb-2">
                    {plan.price}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-neutral-300"
                    >
                      {feature.included ? (
                        <span className="text-success-500 text-xl">✓</span>
                      ) : (
                        <span className="w-5 h-5" />
                      )}
                      <span
                        className={feature.included ? '' : 'line-through opacity-50'}
                      >
                        {feature.text}
                        {feature.highlight && (
                          <span className="ml-2 px-2 py-0.5 bg-gradient-premium text-white text-xs rounded-full">
                            NEW
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={plan.popular ? 'premium' : 'secondary'}
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/connect')}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;