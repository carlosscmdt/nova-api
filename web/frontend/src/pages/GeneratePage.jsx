import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  TextField,
  Banner,
  Box,
  ProgressBar,
  Thumbnail,
  Badge,
  Divider,
  Select,
  Grid,
  Spinner,
  List,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

const STEPS = {
  INPUT: "input",
  SCRAPING: "scraping",
  GENERATING: "generating",
  PREVIEW: "preview",
  BUILDING: "building",
  COMPLETE: "complete",
};

export default function GeneratePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState(STEPS.INPUT);
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [buildResult, setBuildResult] = useState(null);
  const [options, setOptions] = useState({
    language: "en",
    tone: "premium",
  });

  // Handle URL input
  const handleUrlChange = useCallback((value) => setUrl(value), []);

  // API call helper
  const apiCall = async (endpoint, data) => {
    const response = await fetch(`/api${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "API request failed");
    }

    return response.json();
  };

  // Start the generation process
  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("Please enter a product URL");
      return;
    }

    setError(null);

    try {
      // Step 1: Scrape product
      setStep(STEPS.SCRAPING);
      const scrapeResult = await apiCall("/scrape", { url });
      setProductData(scrapeResult.data);

      // Step 2: Generate AI content
      setStep(STEPS.GENERATING);
      const generateResult = await apiCall("/generate", {
        productData: scrapeResult.data,
        options,
      });
      setGeneratedContent(generateResult.data);

      // Step 3: Show preview
      setStep(STEPS.PREVIEW);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.INPUT);
    }
  };

  // Build the store
  const handleBuildStore = async () => {
    try {
      setStep(STEPS.BUILDING);
      const result = await apiCall("/build-store", {
        productData,
        content: generatedContent,
        options,
      });
      setBuildResult(result.data);
      setStep(STEPS.COMPLETE);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.PREVIEW);
    }
  };

  // Reset everything
  const handleReset = () => {
    setUrl("");
    setStep(STEPS.INPUT);
    setError(null);
    setProductData(null);
    setGeneratedContent(null);
    setBuildResult(null);
  };

  // Render based on current step
  const renderContent = () => {
    switch (step) {
      case STEPS.INPUT:
        return (
          <Layout.Section>
            <Card>
              <Box padding="500">
                <BlockStack gap="500">
                  <BlockStack gap="200">
                    <Text variant="headingLg" as="h2">
                      Enter Product URL
                    </Text>
                    <Text tone="subdued">
                      Paste any product link from AliExpress, Amazon, Alibaba, or CJ Dropshipping
                    </Text>
                  </BlockStack>

                  <TextField
                    label="Product URL"
                    value={url}
                    onChange={handleUrlChange}
                    placeholder="https://www.aliexpress.com/item/..."
                    autoComplete="off"
                  />

                  <Grid>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6 }}>
                      <Select
                        label="Language"
                        options={[
                          { label: "English", value: "en" },
                          { label: "German", value: "de" },
                        ]}
                        value={options.language}
                        onChange={(value) =>
                          setOptions((o) => ({ ...o, language: value }))
                        }
                      />
                    </Grid.Cell>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6 }}>
                      <Select
                        label="Tone"
                        options={[
                          { label: "Premium", value: "premium" },
                          { label: "Playful", value: "playful" },
                          { label: "Professional", value: "professional" },
                        ]}
                        value={options.tone}
                        onChange={(value) =>
                          setOptions((o) => ({ ...o, tone: value }))
                        }
                      />
                    </Grid.Cell>
                  </Grid>

                  {error && (
                    <Banner tone="critical">
                      <Text>{error}</Text>
                    </Banner>
                  )}

                  <Button variant="primary" onClick={handleGenerate} size="large">
                    Generate Store
                  </Button>
                </BlockStack>
              </Box>
            </Card>

            {/* Supported Platforms */}
            <Card>
              <Box padding="400">
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">
                    Supported Platforms
                  </Text>
                  <InlineStack gap="200" wrap>
                    <Badge tone="info">AliExpress</Badge>
                    <Badge tone="info">Amazon</Badge>
                    <Badge tone="info">Alibaba</Badge>
                    <Badge tone="info">CJ Dropshipping</Badge>
                    <Badge>Any Website</Badge>
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        );

      case STEPS.SCRAPING:
      case STEPS.GENERATING:
        return (
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="500" align="center">
                  <Spinner size="large" />
                  <BlockStack gap="200" align="center">
                    <Text variant="headingLg" as="h2">
                      {step === STEPS.SCRAPING
                        ? "Scraping Product Data..."
                        : "Generating AI Content..."}
                    </Text>
                    <Text tone="subdued">
                      {step === STEPS.SCRAPING
                        ? "Extracting product information, images, and specifications"
                        : "Creating conversion-optimized copy, brand identity, and store content"}
                    </Text>
                  </BlockStack>
                  <ProgressBar
                    progress={step === STEPS.SCRAPING ? 30 : 70}
                    size="small"
                  />
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        );

      case STEPS.PREVIEW:
        return (
          <>
            <Layout.Section>
              <Banner tone="success">
                <Text variant="headingMd">
                  Content generated successfully! Review and deploy to your store.
                </Text>
              </Banner>
            </Layout.Section>

            {/* Product Preview */}
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <BlockStack gap="400">
                    <Text variant="headingLg" as="h2">
                      Product Preview
                    </Text>
                    <Divider />
                    <Grid>
                      <Grid.Cell columnSpan={{ xs: 6, sm: 2, md: 2, lg: 4 }}>
                        <BlockStack gap="200">
                          {productData?.images?.slice(0, 4).map((img, idx) => (
                            <Thumbnail
                              key={idx}
                              source={img}
                              alt={`Product ${idx + 1}`}
                              size="large"
                            />
                          ))}
                        </BlockStack>
                      </Grid.Cell>
                      <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 8 }}>
                        <BlockStack gap="300">
                          <Badge tone="success">
                            {generatedContent?.brandName}
                          </Badge>
                          <Text variant="headingXl" as="h3">
                            {generatedContent?.product?.title || productData?.title}
                          </Text>
                          <Text tone="subdued">
                            {generatedContent?.product?.subtitle}
                          </Text>
                          <InlineStack gap="200" align="start">
                            <Text variant="headingLg" as="span">
                              ${productData?.price}
                            </Text>
                            {productData?.originalPrice && (
                              <Text
                                as="span"
                                tone="subdued"
                                textDecorationLine="line-through"
                              >
                                ${productData.originalPrice}
                              </Text>
                            )}
                          </InlineStack>
                          <Divider />
                          <Text variant="headingMd">Key Benefits</Text>
                          <List>
                            {generatedContent?.product?.bulletPoints
                              ?.slice(0, 5)
                              .map((point, idx) => (
                                <List.Item key={idx}>{point}</List.Item>
                              ))}
                          </List>
                        </BlockStack>
                      </Grid.Cell>
                    </Grid>
                  </BlockStack>
                </Box>
              </Card>
            </Layout.Section>

            {/* Brand & Homepage */}
            <Layout.Section secondary>
              <BlockStack gap="400">
                <Card>
                  <Box padding="400">
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h3">
                        Brand Identity
                      </Text>
                      <Divider />
                      <Text variant="headingSm">Tagline</Text>
                      <Text>{generatedContent?.brand?.tagline}</Text>
                      <Text variant="headingSm">Values</Text>
                      <InlineStack gap="200">
                        {generatedContent?.brand?.values?.map((v, i) => (
                          <Badge key={i}>{v}</Badge>
                        ))}
                      </InlineStack>
                    </BlockStack>
                  </Box>
                </Card>

                <Card>
                  <Box padding="400">
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h3">
                        Homepage Content
                      </Text>
                      <Divider />
                      <Text variant="headingSm">Hero Headline</Text>
                      <Text>{generatedContent?.homepage?.heroHeadline}</Text>
                      <Text variant="headingSm">CTA Button</Text>
                      <Badge tone="success">
                        {generatedContent?.homepage?.ctaButton}
                      </Badge>
                    </BlockStack>
                  </Box>
                </Card>

                <Card>
                  <Box padding="400">
                    <BlockStack gap="300">
                      <Text variant="headingMd" as="h3">
                        Trust Elements
                      </Text>
                      <Divider />
                      <InlineStack gap="200" wrap>
                        {generatedContent?.trustBadges?.map((badge, i) => (
                          <Badge key={i} tone="info">
                            {badge}
                          </Badge>
                        ))}
                      </InlineStack>
                    </BlockStack>
                  </Box>
                </Card>
              </BlockStack>
            </Layout.Section>

            {/* Actions */}
            <Layout.Section>
              <Card>
                <Box padding="400">
                  <InlineStack gap="300" align="end">
                    <Button onClick={handleReset}>Start Over</Button>
                    <Button variant="primary" onClick={handleBuildStore}>
                      Deploy to Shopify
                    </Button>
                  </InlineStack>
                </Box>
              </Card>
            </Layout.Section>
          </>
        );

      case STEPS.BUILDING:
        return (
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="500" align="center">
                  <Spinner size="large" />
                  <BlockStack gap="200" align="center">
                    <Text variant="headingLg" as="h2">
                      Building Your Store...
                    </Text>
                    <Text tone="subdued">
                      Creating product, uploading images, and configuring your store
                    </Text>
                  </BlockStack>
                  <ProgressBar progress={85} size="small" />
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        );

      case STEPS.COMPLETE:
        return (
          <Layout.Section>
            <Card>
              <Box padding="600">
                <BlockStack gap="500">
                  <Banner tone="success">
                    <BlockStack gap="200">
                      <Text variant="headingMd">
                        Your store has been created successfully!
                      </Text>
                      <Text>
                        Product, images, and all content have been deployed to your Shopify store.
                      </Text>
                    </BlockStack>
                  </Banner>

                  <Divider />

                  <BlockStack gap="300">
                    <Text variant="headingMd">What was created:</Text>
                    <List>
                      <List.Item>
                        Product: {generatedContent?.product?.title}
                      </List.Item>
                      <List.Item>
                        {buildResult?.images?.length || 0} images uploaded
                      </List.Item>
                      <List.Item>SEO meta tags configured</List.Item>
                      <List.Item>FAQ page created</List.Item>
                      <List.Item>About page created</List.Item>
                      <List.Item>Trust badges and social proof added</List.Item>
                    </List>
                  </BlockStack>

                  <Divider />

                  <InlineStack gap="300">
                    <Button
                      url={buildResult?.productUrl}
                      external
                      variant="primary"
                    >
                      View Product
                    </Button>
                    <Button url={buildResult?.adminUrl} external>
                      Edit in Admin
                    </Button>
                    <Button onClick={handleReset}>Create Another Store</Button>
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        );

      default:
        return null;
    }
  };

  return (
    <Page
      backAction={{ content: "Home", onAction: () => navigate("/") }}
      title="Generate Store"
      subtitle="Create a complete store from any product URL"
    >
      <Layout>{renderContent()}</Layout>
    </Page>
  );
}
