import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Banner,
  Box,
  Icon,
  Grid,
} from "@shopify/polaris";
import { ProductIcon, CheckIcon, StarFilledIcon } from "@shopify/polaris-icons";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Page>
      <Layout>
        {/* Hero Section */}
        <Layout.Section>
          <Card>
            <Box padding="800">
              <BlockStack gap="600" align="center">
                <div style={{ textAlign: "center" }}>
                  <Text variant="heading2xl" as="h1">
                    Nova AI Store Builder
                  </Text>
                  <Box paddingBlockStart="200">
                    <Text variant="bodyLg" tone="subdued">
                      Transform any product link into a premium, conversion-optimized Shopify store in seconds.
                    </Text>
                  </Box>
                </div>

                <Button
                  variant="primary"
                  size="large"
                  onClick={() => navigate("/generate")}
                >
                  Start Building Your Store
                </Button>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* How It Works */}
        <Layout.Section>
          <BlockStack gap="400">
            <Text variant="headingLg" as="h2">
              How It Works
            </Text>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 2, lg: 4 }}>
                <Card>
                  <Box padding="400">
                    <BlockStack gap="300">
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "var(--p-color-bg-fill-info)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text variant="headingLg" as="span">
                          1
                        </Text>
                      </div>
                      <Text variant="headingMd" as="h3">
                        Paste Product Link
                      </Text>
                      <Text tone="subdued">
                        Copy any product URL from AliExpress, Amazon, Alibaba, or CJ Dropshipping.
                      </Text>
                    </BlockStack>
                  </Box>
                </Card>
              </Grid.Cell>

              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 2, lg: 4 }}>
                <Card>
                  <Box padding="400">
                    <BlockStack gap="300">
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "var(--p-color-bg-fill-success)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text variant="headingLg" as="span">
                          2
                        </Text>
                      </div>
                      <Text variant="headingMd" as="h3">
                        AI Generates Content
                      </Text>
                      <Text tone="subdued">
                        Our AI creates conversion-optimized copy, brand identity, and premium store design.
                      </Text>
                    </BlockStack>
                  </Box>
                </Card>
              </Grid.Cell>

              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 2, lg: 4 }}>
                <Card>
                  <Box padding="400">
                    <BlockStack gap="300">
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "var(--p-color-bg-fill-warning)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text variant="headingLg" as="span">
                          3
                        </Text>
                      </div>
                      <Text variant="headingMd" as="h3">
                        Deploy to Shopify
                      </Text>
                      <Text tone="subdued">
                        One click creates your product, uploads images, and configures your entire store.
                      </Text>
                    </BlockStack>
                  </Box>
                </Card>
              </Grid.Cell>
            </Grid>
          </BlockStack>
        </Layout.Section>

        {/* Features */}
        <Layout.Section>
          <Card>
            <Box padding="500">
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">
                  What You Get
                </Text>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 6 }}>
                    <BlockStack gap="300">
                      <InlineStack gap="200" align="start">
                        <Icon source={CheckIcon} tone="success" />
                        <Text>Premium product descriptions</Text>
                      </InlineStack>
                      <InlineStack gap="200" align="start">
                        <Icon source={CheckIcon} tone="success" />
                        <Text>Conversion-optimized copy</Text>
                      </InlineStack>
                      <InlineStack gap="200" align="start">
                        <Icon source={CheckIcon} tone="success" />
                        <Text>Professional brand identity</Text>
                      </InlineStack>
                      <InlineStack gap="200" align="start">
                        <Icon source={CheckIcon} tone="success" />
                        <Text>SEO-ready meta tags</Text>
                      </InlineStack>
                    </BlockStack>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 6 }}>
                    <BlockStack gap="300">
                      <InlineStack gap="200" align="start">
                        <Icon source={CheckIcon} tone="success" />
                        <Text>Trust badges & social proof</Text>
                      </InlineStack>
                      <InlineStack gap="200" align="start">
                        <Icon source={CheckIcon} tone="success" />
                        <Text>FAQ pages auto-generated</Text>
                      </InlineStack>
                      <InlineStack gap="200" align="start">
                        <Icon source={CheckIcon} tone="success" />
                        <Text>Homepage hero sections</Text>
                      </InlineStack>
                      <InlineStack gap="200" align="start">
                        <Icon source={CheckIcon} tone="success" />
                        <Text>Testimonials & reviews</Text>
                      </InlineStack>
                    </BlockStack>
                  </Grid.Cell>
                </Grid>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* CTA */}
        <Layout.Section>
          <Banner tone="info">
            <BlockStack gap="200">
              <Text variant="headingMd">Ready to build your store?</Text>
              <Text>
                Paste a product link and watch the magic happen. Your complete store will be ready in under 60 seconds.
              </Text>
              <Box paddingBlockStart="200">
                <Button onClick={() => navigate("/generate")}>
                  Get Started Now
                </Button>
              </Box>
            </BlockStack>
          </Banner>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
