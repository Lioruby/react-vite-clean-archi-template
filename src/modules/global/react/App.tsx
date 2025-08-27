import { useEffect, useState, useCallback } from "react";
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

function App() {
  const [payments, setPayments] = useState<AirwallexPayments | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [step, setStep] = useState<
    "create-customer" | "add-payment" | "completed"
  >("create-customer");
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  const createCustomerUrl =
    "http://localhost:8000/airwallex/create-customer-for-subscription";
  const completeSubscriptionUrl =
    "http://localhost:8000/airwallex/complete-subscription-after-payment";

  useEffect(() => {
    const initializeAirwallex = async () => {
      try {
        const { payments } = await init({
          env: "demo", // Utilisez 'prod' pour la production
          enabledElements: ["payments"],
        });
        setPayments(payments as AirwallexPayments);
      } catch (error) {
        console.error("Erreur lors de l'initialisation d'Airwallex:", error);
      }
    };

    initializeAirwallex();
  }, []);

  const handlePaymentMethodRedirect = useCallback(() => {
    if (!payments || !paymentIntentId || !clientSecret) return;

    // Use Airwallex SDK to redirect to hosted payment page
    payments.redirectToCheckout({
      intent_id: paymentIntentId,
      client_secret: clientSecret,
      country_code: "FR",
      currency: "EUR",
      successUrl: `${window.location.origin}?payment_method=success&customer_id=${customerId}&payment_intent_id=${paymentIntentId}`,
      failUrl: `${window.location.origin}?payment_method=failed&error=payment_failed`,
      methods: ["card", "sepa_direct_debit"],
    });
  }, [payments, paymentIntentId, clientSecret, customerId]);

  // Fonction pour créer automatiquement la subscription après paiement réussi
  const completeSubscription = async (
    customerId: string,
    paymentIntentId: string
  ) => {
    console.log("🚀 Début création subscription:", {
      customerId,
      paymentIntentId,
    });
    setLoading(true);

    try {
      const response = await fetch(completeSubscriptionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: {
            customer_id: customerId,
            payment_intent_id: paymentIntentId,
          },
        }),
      });

      const data = await response.json();
      console.log("📦 Réponse subscription:", data);

      if (data.success) {
        setSubscriptionInfo(data);
        setStep("completed");
        alert("🎉 Subscription créée avec succès !");
      } else {
        alert(`❌ Erreur: ${data.message}`);
        console.error("Erreur subscription:", data);
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error);
      alert("Erreur lors de la finalisation de l'abonnement");
    } finally {
      setLoading(false);
    }
  };

  // Check URL params for success callback - DOIT S'EXECUTER AU CHARGEMENT
  useEffect(() => {
    console.log("🔍 Checking URL params...");
    const urlParams = new URLSearchParams(window.location.search);
    const paymentMethod = urlParams.get("payment_method");
    const urlCustomerId = urlParams.get("customer_id");
    const urlPaymentIntentId = urlParams.get("payment_intent_id");

    console.log("URL params:", {
      paymentMethod,
      urlCustomerId,
      urlPaymentIntentId,
      currentStep: step,
    });

    if (paymentMethod === "success" && urlCustomerId && urlPaymentIntentId) {
      console.log(
        "✅ Paiement détecté comme réussi ! Création de la subscription..."
      );

      // Mettre à jour les states
      setCustomerId(urlCustomerId);
      setPaymentIntentId(urlPaymentIntentId);

      // Créer automatiquement la subscription
      completeSubscription(urlCustomerId, urlPaymentIntentId);

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentMethod === "failed") {
      const error = urlParams.get("error");
      alert(`❌ Erreur lors du paiement: ${error}`);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // Enlever la dépendance sur 'step' pour que ça s'exécute toujours

  const createCustomer = async () => {
    setLoading(true);

    try {
      const response = await fetch(createCustomerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: {
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@example.com",
            phone_number: "+33612345678",
          },
        }),
      });

      const data = await response.json();
      console.log("Customer créé:", data);

      if (data.customer_id && data.payment_intent_id && data.client_secret) {
        setCustomerId(data.customer_id);
        setPaymentIntentId(data.payment_intent_id);
        setClientSecret(data.client_secret);
        setStep("add-payment");
      }
    } catch (error) {
      console.error("Erreur lors de la création du customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setCustomerId(null);
    setPaymentIntentId(null);
    setClientSecret(null);
    setSubscriptionInfo(null);
    setStep("create-customer");
  };

  return (
    <div
      data-testid="app"
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Subscription Airwallex
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Abonnement mensuel de 20 EUR
        </p>

        {/* Debug info */}
        <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
          <div>Step: {step}</div>
          <div>Customer ID: {customerId}</div>
          <div>Payment Intent ID: {paymentIntentId}</div>
          <div>Loading: {loading.toString()}</div>
        </div>

        {step === "create-customer" && (
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-4">
              Étape 1: Créer votre compte
            </h2>
            <button
              onClick={createCustomer}
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
                "Créer mon compte"
              )}
            </button>
          </div>
        )}

        {step === "add-payment" && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-center">
              Étape 2: Premier paiement (20 EUR)
            </h2>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Vous allez être redirigé vers la page sécurisée Airwallex pour
                effectuer votre premier paiement de 20 EUR. L'abonnement sera
                automatiquement activé après le paiement.
              </p>
              <button
                onClick={handlePaymentMethodRedirect}
                disabled={!payments || loading || !paymentIntentId}
                className={`
                  w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200
                  ${
                    !payments || loading || !paymentIntentId
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                `}
              >
                {!paymentIntentId
                  ? "Préparation..."
                  : "Payer 20 EUR et s'abonner"}
              </button>
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              Paiement sécurisé par Airwallex
            </p>
          </div>
        )}

        {step === "completed" && (
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
                🎉 Abonnement activé !
              </h2>
              <p className="text-gray-600 mb-4">
                {subscriptionInfo?.message ||
                  "Votre abonnement mensuel de 20 EUR a été créé avec succès."}
              </p>

              {subscriptionInfo && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                  <h3 className="font-semibold mb-2">
                    Détails de l'abonnement :
                  </h3>
                  <p className="text-sm text-gray-600">
                    <strong>Customer ID:</strong> {subscriptionInfo.customer_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Subscription ID:</strong>{" "}
                    {subscriptionInfo.subscription?.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Statut:</strong>{" "}
                    {subscriptionInfo.subscription?.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Prochain paiement:</strong>{" "}
                    {subscriptionInfo.subscription?.next_billing_at}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={resetFlow}
              className="w-full py-3 px-6 rounded-lg font-semibold text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              Créer un nouvel abonnement
            </button>
          </div>
        )}

        {/* Indicateur de chargement global */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-800 font-semibold">
                {step === "add-payment"
                  ? "Finalisation de l'abonnement..."
                  : "Traitement..."}
              </p>
              <p className="text-gray-600 text-sm">Veuillez patienter</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${step === "create-customer" ? "bg-blue-600" : "bg-gray-300"}`}
          ></div>
          <div
            className={`w-3 h-3 rounded-full ${step === "add-payment" ? "bg-blue-600" : "bg-gray-300"}`}
          ></div>
          <div
            className={`w-3 h-3 rounded-full ${step === "completed" ? "bg-green-600" : "bg-gray-300"}`}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default App;
