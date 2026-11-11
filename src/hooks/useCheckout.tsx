import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/** Creates a Stripe Checkout Session on the backend and redirects to it. */
export const useCheckout = () => {
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const checkout = async (contentId: string) => {
    if (!user) {
      toast.error("Entre na sua conta para comprar");
      return;
    }
    setIsPending(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { contentId, origin: window.location.origin },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Checkout indisponível");
      window.location.href = data.url as string;
    } catch (err) {
      console.error("checkout failed", err);
      toast.error("Não foi possível iniciar o pagamento");
    } finally {
      setIsPending(false);
    }
  };

  return { checkout, isPending };
};
