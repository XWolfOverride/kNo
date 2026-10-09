import { useState, useEffect, useMemo, useCallback } from 'react';
import { api, getStoredToken } from './api';
import { User, Item, ItemUrl } from './types';
import { buildCategoryTree, itemMatchesCategory } from './utils/categories';
import { SetupScreen } from './components/SetupScreen';
import { AuthScreen } from './components/AuthScreen';
import { UnifiedHeader } from './components/UnifiedHeader';
import { CategoryDrawer } from './components/CategoryDrawer';
import { ItemList } from './components/ItemList';
import { ItemEditorView } from './components/ItemEditorView';
import { AdminPanel } from './components/AdminPanel';
import { DeleteModal } from './components/DeleteModal';
import { BrainBulbIcon } from './components/BrainBulbIcon';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // App View navigation: 'list' | 'editor' | 'admin'
  const [activeView, setActiveView] = useState<'list' | 'editor' | 'admin'>('list');

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer & Modals
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check auth session on startup and check if first-run setup is required
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      api
        .getSetupStatus()
        .then((res) => {
          setNeedsSetup(res.needsSetup);
        })
        .catch(() => {})
        .finally(() => {
          setAuthChecking(false);
        });
      return;
    }

    api
      .getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(async () => {
        setUser(null);
        try {
          const res = await api.getSetupStatus();
          setNeedsSetup(res.needsSetup);
        } catch {}
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  // Fetch items when user is authenticated
  const loadItems = useCallback(async () => {
    if (!user) return;
    setLoadingItems(true);
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setLoadingItems(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [user, loadItems]);

  // Compute hierarchical category tree from all current items
  const categoryTree = useMemo(() => {
    return buildCategoryTree(items);
  }, [items]);

  // Filter items by category and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (!itemMatchesCategory(item, selectedCategory)) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesContent = (item.content || item.notes || '').toLowerCase().includes(q);
        const matchesCats = item.categories.some((c) => c.toLowerCase().includes(q));
        const matchesUrls = item.urls?.some(
          (u) => u.url.toLowerCase().includes(q) || u.description.toLowerCase().includes(q)
        );

        if (!matchesTitle && !matchesContent && !matchesCats && !matchesUrls) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  // Auth Handlers
  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleSetupComplete = (authenticatedAdmin: User) => {
    setUser(authenticatedAdmin);
    setNeedsSetup(false);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setSelectedCategory(null);
    setSearchQuery('');
    setActiveView('list');
    try {
      const res = await api.getSetupStatus();
      setNeedsSetup(res.needsSetup);
    } catch {}
  };

  // Item CRUD Handlers
  const handleSaveItem = async (data: {
    title: string;
    categories: string;
    urls?: ItemUrl[];
    content?: string;
  }) => {
    if (itemToEdit) {
      const updated = await api.updateItem(itemToEdit.id, data);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    } else {
      const created = await api.createItem(data);
      setItems((prev) => [created, ...prev]);
    }
    setActiveView('list');
    setItemToEdit(null);
  };

  const handleOpenCreate = () => {
    setItemToEdit(null);
    setActiveView('editor');
  };

  const handleEditClick = (item: Item) => {
    setItemToEdit(item);
    setActiveView('editor');
  };

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteCandidate({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await api.deleteItem(deleteCandidate.id);
      setItems((prev) => prev.filter((it) => it.id !== deleteCandidate.id));
      setDeleteCandidate(null);
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading screen during initial auth verification
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#13160e] flex flex-col items-center justify-center text-[#9fa691]">
        <div className="w-12 h-12 rounded-2xl bg-[#22281a] text-[#c85718] flex items-center justify-center mb-3 shadow-lg shadow-black/40">
          <BrainBulbIcon className="w-6 h-6 animate-pulse text-[#c85718]" />
        </div>
        <p className="text-xs font-mono text-[#9fa691]">kNo...</p>
      </div>
    );
  }

  // First-Run Bootstrap Setup Wizard (Option C)
  if (needsSetup) {
    return <SetupScreen onSetupComplete={handleSetupComplete} />;
  }

  // Not authenticated: Show Login screen
  if (!user) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#13160e] text-[#f5f6f0] flex justify-center">
      {/* Mobile-First App Shell: max-w-2xl window container on desktop, full screen on mobile */}
      <div className="w-full max-w-2xl min-h-screen bg-[#181c13] sm:shadow-2xl sm:shadow-black/70 flex flex-col relative overflow-hidden">
        {activeView === 'editor' ? (
          /* Editor View: Feels like navigating to a full page without popup frames */
          <ItemEditorView
            itemToEdit={itemToEdit}
            onSave={handleSaveItem}
            onBack={() => {
              setActiveView('list');
              setItemToEdit(null);
            }}
          />
        ) : activeView === 'admin' ? (
          /* Admin Panel View: Manual user management & disable accounts */
          <AdminPanel
            currentUser={user}
            onBack={() => setActiveView('list')}
          />
        ) : (
          /* List View */
          <>
            {/* Single Unified Header */}
            <UnifiedHeader
              user={user}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onOpenCategories={() => setCategoryDrawerOpen(true)}
              onOpenCreateModal={handleOpenCreate}
              onOpenAdmin={() => setActiveView('admin')}
              onLogout={handleLogout}
            />

            {/* Category Drawer: deployed to the left relative to application space */}
            <CategoryDrawer
              isOpen={categoryDrawerOpen}
              onClose={() => setCategoryDrawerOpen(false)}
              categories={categoryTree}
              selectedCategory={selectedCategory}
              onSelectCategory={(path) => {
                setSelectedCategory(path);
                setCategoryDrawerOpen(false);
              }}
              totalItemsCount={items.length}
            />

            {/* Main Items Listing with Divider-separated styling */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ItemList
                items={filteredItems}
                loading={loadingItems}
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                onSelectCategory={(path) => setSelectedCategory(path)}
                onClearSearch={() => setSearchQuery('')}
                onEditItem={handleEditClick}
                onDeleteItem={handleDeleteClick}
                onOpenCreateModal={handleOpenCreate}
              />
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteModal
          isOpen={deleteCandidate !== null}
          itemTitle={deleteCandidate?.title || ''}
          loading={isDeleting}
          onClose={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
}
