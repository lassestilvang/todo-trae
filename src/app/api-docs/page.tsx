import { getApiDocs } from '@/lib/swagger';
import ApiDocsPage from '@/components/ApiDocs';

export default async function Page() {
  const spec = getApiDocs();
  return <ApiDocsPage spec={spec} />;
}
