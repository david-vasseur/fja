import { Suspense } from "react";
import OperationBoard from "../components/OperationBoard";

async function OperationContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OperationBoard slug={slug} />;
}

export default function OperationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-slate-950 flex items-center justify-center text-amber-400 text-sm">
          Chargement de l&apos;opération...
        </div>
      }
    >
      <OperationContent params={params} />
    </Suspense>
  );
}
