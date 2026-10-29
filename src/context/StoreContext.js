import { createContext, useContext } from 'react';

// Keep context identity independent of provider hot updates during development.
export const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);
