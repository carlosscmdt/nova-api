import { useState, useCallback, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  TextField,
  Banner,
  Box,
  Select,
  Divider,
} from "@shopify/polaris";

export default function SettingsPage() {
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [defaultTone, setDefaultTone] = useState("premium");

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const response = await fetch("/api/shop");
      const data = await response.json();
      if (data.success) {
        setShopData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Settings" subtitle="Configure your Nova AI Store Builder preferences">
      <Layout>
        {/* Shop Info */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Connected Store
                </Text>
                <Divider />
                {loading ? (
                  <Text>Loading...</Text>
                ) : shopData ? (
                  <BlockStack gap="200">
                    <Text>
                      <Text as="span" fontWeight="semibold">
                        Store Name:
                      </Text>{" "}
                      {shopData.name}
                    </Text>
                    <Text>
                      <Text as="span" fontWeight="semibold">
                        Domain:
                      </Text>{" "}
                      {shopData.domain}
                    </Text>
                    <Text>
                      <Text as="span" fontWeight="semibold">
                        Email:
                      </Text>{" "}
                      {shopData.email}
                    </Text>
                    <Text>
                      <Text as="span" fontWeight="semibold">
                        Plan:
                      </Text>{" "}
                      {shopData.plan_name}
                    </Text>
                  </BlockStack>
                ) : (
                  <Banner tone="warning">
                    <Text>Could not load shop information</Text>
                  </Banner>
                )}
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* Default Settings */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Default Generation Settings
                </Text>
                <Divider />
                <Select
                  label="Default Language"
                  options={[
                    { label: "English", value: "en" },
                    { label: "German", value: "de" },
                  ]}
                  value={defaultLanguage}
                  onChange={setDefaultLanguage}
                  helpText="Language for generated content"
                />
                <Select
                  label="Default Tone"
                  options={[
                    { label: "Premium", value: "premium" },
                    { label: "Playful", value: "playful" },
                    { label: "Professional", value: "professional" },
                  ]}
                  value={defaultTone}
                  onChange={setDefaultTone}
                  helpText="Writing style for AI-generated copy"
                />
                <Button variant="primary">Save Settings</Button>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* About */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">
                  About Nova AI
                </Text>
                <Divider />
                <Text tone="subdued">
                  Nova AI Store Builder uses advanced AI to transform any product link into a
                  complete, conversion-optimized Shopify store. Our AI generates premium
                  copywriting, brand identity, SEO content, and more.
                </Text>
                <Text tone="subdued">Version 1.0.0</Text>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
