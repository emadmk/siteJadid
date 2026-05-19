import { CollectionEditor } from '@/components/admin/CollectionEditor';

export default function EditCollectionPage({ params }: { params: { id: string } }) {
  return <CollectionEditor collectionId={params.id} />;
}
