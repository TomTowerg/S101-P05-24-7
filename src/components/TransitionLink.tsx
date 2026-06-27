"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  href: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

export default function TransitionLink({ href, children, className, ...props }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (active) return;
    setActive(true);
    setTimeout(() => router.push(href), 520);
  };

  return (
    <>
      <a href={href} onClick={handleClick} className={className} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>

      <AnimatePresence>
        {active && (
          <motion.div
            key="transition-overlay"
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Dark veil */}
            <div className="absolute inset-0 bg-[#050510]" />

            {/* Central glow burst — indigo portal */}
            <motion.div
              className="relative z-10 rounded-full"
              initial={{ width: 0, height: 0, opacity: 0 }}
              animate={{ width: 600, height: 600, opacity: 0.18 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background:
                  "radial-gradient(circle, rgba(99,102,241,1) 0%, rgba(139,92,246,0.6) 40%, transparent 75%)",
                filter: "blur(40px)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
