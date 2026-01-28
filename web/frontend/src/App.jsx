import { useState, useCallback } from "react";
import { AppProvider, Frame, Navigation, TopBar } from "@shopify/polaris";
import { HomeIcon, ProductIcon, SettingsIcon } from "@shopify/polaris-icons";
import enTranslations from "@shopify/polaris/locales/en.json";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";

import HomePage from "./pages/HomePage";
import GeneratePage from "./pages/GeneratePage";
import SettingsPage from "./pages/SettingsPage";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  const toggleMobileNavigationActive = useCallback(
    () => setMobileNavigationActive((active) => !active),
    []
  );

  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            label: "Home",
            icon: HomeIcon,
            onClick: () => navigate("/"),
            selected: location.pathname === "/",
          },
          {
            label: "Generate Store",
            icon: ProductIcon,
            onClick: () => navigate("/generate"),
            selected: location.pathname === "/generate",
          },
          {
            label: "Settings",
            icon: SettingsIcon,
            onClick: () => navigate("/settings"),
            selected: location.pathname === "/settings",
          },
        ]}
      />
    </Navigation>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigationActive}
    />
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigationActive}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Frame>
  );
}

export default function App() {
  return (
    <AppProvider i18n={enTranslations}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}
