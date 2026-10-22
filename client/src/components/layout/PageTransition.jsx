import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { prefersReducedMotion } from '../../utils/motion.js';

export function PageTransition({ activeIndex, previousIndex, children }) {
  const direction = activeIndex >= previousIndex ? 1 : -1;
  const isReduced = prefersReducedMotion();

  const variants = {
    initial: (dir) => ({
      x: isReduced ? 0 : (dir > 0 ? 30 : -30),
      opacity: 0,
      scale: isReduced ? 1 : 0.985
    }),
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: isReduced
        ? { duration: 0.1 }
        : {
            type: 'spring',
            stiffness: 340,
            damping: 30,
            mass: 0.8
          }
    },
    exit: (dir) => ({
      x: isReduced ? 0 : (dir > 0 ? -30 : 30),
      opacity: 0,
      scale: isReduced ? 1 : 0.985,
      transition: { duration: 0.12 }
    })
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden">
      {React.Children.map(children, (child, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            key={index}
            role="tabpanel"
            id={`tabpanel-${index}`}
            className={`w-full min-h-screen ${
              isActive ? 'block' : 'hidden pointer-events-none'
            }`}
            aria-hidden={!isActive}
          >
            {isActive && (
              <motion.div
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full min-h-screen"
              >
                {child}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PageTransition;
