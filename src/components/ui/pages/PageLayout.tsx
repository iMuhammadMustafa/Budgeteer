import { ReactNode } from "react";
import { ScrollView } from "react-native";

import { PageHeader } from "./PageHeader";

interface PageLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  title?: string;
  subtitle: string;
  caption?: string;
  className?: string;
  backHref?: string;
  testID?: string;
  end?: ReactNode;
}

export default function PageLayout({
  children,
  header,
  title,
  subtitle,
  caption,
  className,
  backHref,
  testID = "page-header",
  end,
}: PageLayoutProps) {
  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="p-5 gap-2 w-full self-center"
      contentContainerStyle={{ maxWidth: 1180 }}
    >
      {header ? (
        header
      ) : (
        <PageHeader
          title={title}
          subtitle={subtitle}
          caption={caption}
          className={className}
          backHref={backHref}
          testID={testID}
          end={end}
        />
      )}

      {children}
    </ScrollView>
  );
}
