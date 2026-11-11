import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2, Mail } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  title?: string;
  text?: string;
  url?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Brand SVG Icons
const WhatsAppIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const XTwitterIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.923z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
  </svg>
);

export const ShareDialog: React.FC<ShareDialogProps> = ({
  title = "Worsco — Livros Digitais, Notícias e Webtoons",
  text = "Confira este conteúdo imperdível na Worsco:",
  url,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}) => {
  const [copied, setCopied] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const currentUrl =
    url || (typeof window !== "undefined" ? window.location.href : "https://worsco.vercel.app");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <WhatsAppIcon />,
      color: "hover:bg-emerald-600 hover:text-white bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      action: () => {
        const shareText = encodeURIComponent(`${title}\n${text}\n${currentUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${shareText}`, "_blank", "noopener,noreferrer");
      },
    },
    {
      name: "X (Twitter)",
      icon: <XTwitterIcon />,
      color: "hover:bg-zinc-800 hover:text-white bg-zinc-800/10 text-zinc-300 border-zinc-700/40",
      action: () => {
        const tweetText = encodeURIComponent(title);
        window.open(
          `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(currentUrl)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      name: "Telegram",
      icon: <TelegramIcon />,
      color: "hover:bg-sky-500 hover:text-white bg-sky-500/10 text-sky-400 border-sky-500/20",
      action: () => {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      name: "LinkedIn",
      icon: <LinkedInIcon />,
      color: "hover:bg-blue-600 hover:text-white bg-blue-600/10 text-blue-500 border-blue-500/20",
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      name: "Facebook",
      icon: <FacebookIcon />,
      color: "hover:bg-blue-700 hover:text-white bg-blue-700/10 text-blue-600 border-blue-600/20",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      name: "E-mail",
      icon: <Mail className="h-4 w-4" />,
      color: "hover:bg-zinc-700 hover:text-white bg-zinc-800/20 text-zinc-400 border-zinc-700/40",
      action: () => {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`${text}\n\n${currentUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      },
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-base font-medium flex items-center gap-2">
            <Share2 className="h-4 w-4 text-emerald-400" />
            Compartilhar Conteúdo
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Envie este link para amigos, grupos ou redes sociais.
          </DialogDescription>
        </DialogHeader>

        {/* Social Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-3">
          {shareOptions.map((opt) => (
            <button
              key={opt.name}
              onClick={opt.action}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-xs font-light gap-1.5 ${opt.color}`}
            >
              {opt.icon}
              <span className="text-[11px] truncate max-w-full">{opt.name}</span>
            </button>
          ))}
        </div>

        {/* Copy Link Input */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
            Link direto
          </label>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={currentUrl}
              className="bg-zinc-900 border-zinc-700/60 text-xs text-zinc-300 font-mono select-all h-9"
            />
            <Button
              onClick={handleCopy}
              size="sm"
              variant={copied ? "default" : "outline"}
              className="h-9 px-3 shrink-0 text-xs gap-1.5 border-zinc-700"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
