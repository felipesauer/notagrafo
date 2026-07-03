import { type JSX, type ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';

/**
 * Primitivos de animação (Framer Motion) usados com parcimônia no redesign.
 * Todos respeitam prefers-reduced-motion: quando o usuário pede menos movimento,
 * o conteúdo aparece sem transição (sem deslocamento nem fade prolongado).
 */

const fade: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

/** Container que entra os filhos em stagger suave. Use com <FadeItem>. */
export function StaggerGrid({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? false : 'hidden'}
            animate="show"
            variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.05 } } }}
        >
            {children}
        </motion.div>
    );
}

/** Item filho de StaggerGrid (ou isolado): fade+subida curta. */
export function FadeItem({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
    const reduce = useReducedMotion();
    return (
        <motion.div className={className} variants={reduce ? undefined : fade}>
            {children}
        </motion.div>
    );
}

/** Fade-in simples de um bloco (sem stagger), para seções isoladas. */
export function FadeIn({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }): JSX.Element {
    const reduce = useReducedMotion();
    if (reduce) return <div className={className}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
}
