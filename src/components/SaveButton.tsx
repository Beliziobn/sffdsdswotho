import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "./ui/button";
import type { Content } from "@/hooks/useContents";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useToggleSave } from "@/hooks/useSavedItems";

interface SaveButtonProps {
  item: Content;
  className?: string;
}

const SaveButton = ({ item, className = "" }: SaveButtonProps) => {
  const saved = useLibraryStore((s) => !!s.savedIds[item.id]);
  const toggleSave = useToggleSave();

  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
      <Button
        variant="outline"
        aria-pressed={saved}
        onClick={() => toggleSave(item)}
        className={`rounded-md text-[11px] uppercase tracking-wider font-normal w-full ${className}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={saved ? "saved" : "unsaved"}
            initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 20 }}
            transition={{ duration: 0.18 }}
            className="mr-2 inline-flex"
          >
            {saved ? (
              <BookmarkCheck className="h-3 w-3 fill-primary text-primary" />
            ) : (
              <Bookmark className="h-3 w-3" />
            )}
          </motion.span>
        </AnimatePresence>
        {saved ? "Salvo" : "Salvar"}
      </Button>
    </motion.div>
  );
};

export default SaveButton;
