import { useEffect, useState } from "react";
import { init } from "@airwallex/components-sdk";

interface AirwallexPayments {
  redirectToCheckout: (options: {
    intent_id: string;
    client_secret: string;
    country_code: string;
    currency: string;
    successUrl: string;
    failUrl: string;
    methods?: string[];
  }) => string | void;
}

interface PaymentIntent {
  id: string;
  client_secret: string;
  status: string;
}

function App() {
  const [payments, setPayments] = useState<AirwallexPayments | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(
    null
  );
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "success" | "failed"
  >("idle");

  const createPaymentIntentUrl =
    "http://localhost:8000/airwallex/create-payment-intent";

  useEffect(() => {
    const initializeAirwallex = async () => {
      try {
        const { payments } = await init({
          env: "prod",
          enabledElements: ["payments"],
        });
        setPayments(payments as AirwallexPayments);
      } catch (error) {
        console.error("Erreur lors de l'initialisation d'Airwallex:", error);
      }
    };

    initializeAirwallex();
  }, []);

  // Check URL params for payment result
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");

    if (status === "success") {
      setPaymentStatus("success");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === "failed") {
      setPaymentStatus("failed");
      const error = urlParams.get("error");
      if (error) {
        console.error("Payment error:", error);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const createPaymentIntent = async () => {
    setLoading(true);
    setPaymentStatus("idle");

    try {
      const response = await fetch(createPaymentIntentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Payment Intent créé:", data);
      setPaymentIntent(data);
    } catch (error) {
      console.error("Erreur lors de la création du payment intent:", error);
      alert("Erreur lors de la création du paiement");
    } finally {
      setLoading(false);
    }
  };

  const redirectToCheckout = () => {
    if (!payments || !paymentIntent) return;

    payments.redirectToCheckout({
      intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      country_code: "FR",
      currency: "EUR",
      successUrl: `${window.location.origin}?status=success`,
      failUrl: `${window.location.origin}?status=failed`,
      methods: ["card", "sepa_direct_debit"],
    });
  };

  const resetFlow = () => {
    setPaymentIntent(null);
    setPaymentStatus("idle");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center 
  justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Paiement Airwallex
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Test de paiement de 5 EUR
        </p>

        {paymentStatus === "idle" && !paymentIntent && (
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-4">
              Créer un paiement de 5€
            </h2>
            <button
              onClick={createPaymentIntent}
              disabled={loading}
              className={`
                  w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 
                  ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:scale-105"
                  }
                `}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Création en cours...</span>
                </div>
              ) : (
                "Créer le paiement"
              )}
            </button>
          </div>
        )}

        {paymentIntent && paymentStatus === "idle" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-center">
              Payer 5 EUR
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                <strong>Payment Intent ID:</strong> {paymentIntent.id}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Montant:</strong> 5 EUR
              </p>
              <p className="text-sm text-gray-600">
                <strong>Status:</strong> {paymentIntent.status}
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Vous allez être redirigé vers la page sécurisée Airwallex pour
              payer par carte ou virement SEPA (TrueLayer).
            </p>
            <button
              onClick={redirectToCheckout}
              disabled={!payments || loading}
              className={`
                  w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200
                  ${
                    !payments || loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                `}
            >
              Procéder au paiement
            </button>
            <p className="text-sm text-gray-500 text-center mt-4">
              Paiement sécurisé par Airwallex
            </p>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-green-800 mb-2">
                Paiement réussi !
              </h2>
              <p className="text-gray-600 mb-4">
                Votre paiement de 5 EUR a été effectué avec succès.
              </p>
            </div>
            <button
              onClick={resetFlow}
              className="w-full py-3 px-6 rounded-lg font-semibold text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              Faire un nouveau paiement
            </button>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-red-800 mb-2">
                Paiement échoué
              </h2>
              <p className="text-gray-600 mb-4">
                Le paiement n'a pas pu être effectué. Veuillez réessayer.
              </p>
            </div>
            <button
              onClick={resetFlow}
              className="w-full py-3 px-6 rounded-lg font-semibold text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              Réessayer
            </button>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-800 font-semibold">Traitement...</p>
              <p className="text-gray-600 text-sm">Veuillez patienter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
