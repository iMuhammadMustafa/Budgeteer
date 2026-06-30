/**
 * PageHeader — a header for a full-screen page with a title and subtitle
 * (or custom caption). The title is in h1 (large, bold), the subtitle is smaller.
 */
import { type ReactNode } from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import { router } from "expo-router/build/imperative-api";

import { IconButton } from "../IconButton";
import { Text } from "../Text";

export interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  caption?: ReactNode;
  className?: string;
  backHref?: Href;
  testID?: string;
}

export function PageHeader({ title, subtitle, caption, className, backHref, testID = "page-header" }: PageHeaderProps) {
  return (
    <View className="mb-2">
      <View className="flex-row items-center gap-2">
        {backHref ? (
          <Link href={backHref} asChild>
            <IconButton
              variant="ghost"
              className="p-0 m-0"
              onPress={() => router.navigate(backHref)}
              icon="ArrowLeft"
              size="sm"
              accessibilityLabel="Back"
            />
          </Link>
        ) : null}
        {title && <Text variant="h2">{title}</Text>}
      </View>
      <View>
        {subtitle ? (
          <Text variant="caption" className="text-muted-foreground" selectable={false}>
            {subtitle}
          </Text>
        ) : null}
        {caption ? <View className="mt-2">{caption}</View> : null}
      </View>
    </View>
  );
}
