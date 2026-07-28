'use client';

import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

export default observer(function HomePlaceholder() {
  const store = useFundOsStore();
  if (!store.ready) return <div style={{ padding: 30 }}>Loading FundOS…</div>;
  return <div style={{ padding: 30 }}>FundOS scaffold ready. Command Center screen lands in Plan 2.</div>;
});
