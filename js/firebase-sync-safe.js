// Firebase Sync - SAFE VERSION
// No database schema changes required
// Handles missing fields gracefully
// Never wipes local data

const auth = firebase.auth();
const firestore = firebase.firestore();

let currentUser = null;
let isSyncing = false;

console.log('🔥 Firebase initialized (safe sync)');

// Auth state listener
auth.onAuthStateChanged(async (user) => {
  currentUser = user;

  if (user) {
    console.log('✅ User signed in:', user.email);
    showUserInfo(user);

    // Give UI time to load before syncing
    setTimeout(() => {
      safeSync();
    }, 1000);
  } else {
    console.log('❌ User signed out');
    showLoginButton();
  }
});

// Sign in with Google
async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    console.log('Signed in as:', result.user.email);
  } catch (error) {
    console.error('Sign-in error:', error);
    alert('Failed to sign in: ' + error.message);
  }
}

// Sign out
async function signOutUser() {
  try {
    await auth.signOut();
    console.log('Signed out successfully');
  } catch (error) {
    console.error('Sign-out error:', error);
  }
}

// SAFE SYNC - Smart merge without breaking anything
async function safeSync() {
  if (!currentUser || isSyncing) return;

  isSyncing = true;
  console.log('🔄 Starting safe sync...');

  try {
    const userId = currentUser.uid;

    // Sync each collection safely
    await safeSyncCollection('subjects', userId);
    await safeSyncCollection('assignments', userId);
    await safeSyncCollection('notes', userId);
    await safeSyncCollection('links', userId);
    await safeSyncCollection('calendarTasks', userId);

    console.log('✅ Safe sync complete');
  } catch (error) {
    console.error('❌ Sync error:', error);
    alert('Sync failed: ' + error.message);
  } finally {
    isSyncing = false;
  }
}

// Safe sync for a single collection
async function safeSyncCollection(collectionName, userId) {
  console.log(`📦 Syncing ${collectionName}...`);

  try {
    // Get local data
    const localItems = await db[collectionName].toArray();
    console.log(`  Local ${collectionName}: ${localItems.length} items`);

    // Get remote data
    const remoteSnapshot = await firestore
      .collection('users')
      .doc(userId)
      .collection(collectionName)
      .get();

    console.log(`  Remote ${collectionName}: ${remoteSnapshot.docs.length} items`);

    // Convert remote to map for easy lookup
    const remoteMap = {};
    remoteSnapshot.docs.forEach(doc => {
      remoteMap[doc.id] = { ...doc.data(), id: doc.id };
    });

    const batch = firestore.batch();
    const localUpdates = [];

    // Process local items
    for (const localItem of localItems) {
      const itemId = String(localItem.id);
      const remoteItem = remoteMap[itemId];

      if (!remoteItem) {
        // Item only exists locally - upload to Firebase
        const ref = firestore.collection('users').doc(userId).collection(collectionName).doc(itemId);

        // Add timestamp if not present (safe - doesn't require schema change)
        const itemToUpload = {
          ...localItem,
          lastModified: localItem.lastModified || localItem.createdAt || Date.now()
        };

        batch.set(ref, itemToUpload);
        console.log(`  ⬆️ Upload new: ${itemId}`);
      } else {
        // Item exists in both - compare timestamps
        const localTime = localItem.lastModified || localItem.createdAt || 0;
        const remoteTime = remoteItem.lastModified || remoteItem.createdAt || 0;

        if (localTime > remoteTime) {
          // Local is newer - upload
          const ref = firestore.collection('users').doc(userId).collection(collectionName).doc(itemId);
          batch.set(ref, {
            ...localItem,
            lastModified: localTime
          });
          console.log(`  ⬆️ Upload updated: ${itemId}`);
        } else if (remoteTime > localTime) {
          // Remote is newer - download
          // Handle deleted items
          if (remoteItem.deleted === true) {
            // Delete locally
            await db[collectionName].delete(parseInt(itemId));
            console.log(`  🗑️ Delete local: ${itemId}`);
          } else {
            // Update locally
            localUpdates.push(remoteItem);
            console.log(`  ⬇️ Download updated: ${itemId}`);
          }
        }
        // If equal, already in sync

        // Mark as processed
        delete remoteMap[itemId];
      }
    }

    // Process remaining remote items (only on server)
    for (const itemId in remoteMap) {
      const remoteItem = remoteMap[itemId];

      // Skip deleted items
      if (remoteItem.deleted === true) {
        console.log(`  ⏭️ Skip deleted: ${itemId}`);
        continue;
      }

      // Add to local
      localUpdates.push(remoteItem);
      console.log(`  ⬇️ Download new: ${itemId}`);
    }

    // Commit Firebase batch
    if (batch._mutations && batch._mutations.length > 0) {
      await batch.commit();
      console.log(`  ✅ Firebase batch committed`);
    }

    // Apply local updates
    for (const item of localUpdates) {
      try {
        // Use put to update existing or add new
        await db[collectionName].put(item);
      } catch (error) {
        console.error(`  ❌ Error updating local item ${item.id}:`, error);
      }
    }

    console.log(`  ✅ ${collectionName} synced`);

  } catch (error) {
    console.error(`❌ Error syncing ${collectionName}:`, error);
    throw error;
  }
}

// Wrapper for safe delete (sets deleted flag and syncs)
async function safeDelete(collectionName, itemId) {
  // Update locally with deleted flag
  await db[collectionName].update(itemId, {
    deleted: true,
    lastModified: Date.now()
  });

  // Sync to Firebase if signed in
  if (currentUser) {
    const item = await db[collectionName].get(itemId);
    const ref = firestore
      .collection('users')
      .doc(currentUser.uid)
      .collection(collectionName)
      .doc(String(itemId));

    await ref.set(item);
  }

  console.log(`🗑️ Soft deleted ${collectionName}/${itemId}`);
}

// UI Functions
function showLoginButton() {
  const userSection = document.getElementById('top-menu-user-section');
  if (userSection) {
    userSection.innerHTML = `
      <div class="top-menu-item" id="dropdown-sign-in-btn">
        <span class="icon">🔐</span>
        <span>Sign in with Google</span>
      </div>
    `;
    const btn = document.getElementById('dropdown-sign-in-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        signInWithGoogle();
        const dropdown = document.getElementById('top-menu-dropdown');
        if (dropdown) dropdown.classList.remove('active');
      });
    }
  }
}

function showUserInfo(user) {
  const displayName = user.displayName || user.email.split('@')[0];

  const userSection = document.getElementById('top-menu-user-section');
  if (userSection) {
    userSection.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; padding: 12px; border-bottom: 1px solid var(--border);">
        ${user.photoURL ? `<img src="${user.photoURL}" alt="Profile" style="width: 36px; height: 36px; border-radius: 50%;">` : ''}
        <div style="flex: 1;">
          <div style="font-size: 14px; font-weight: 500;">${displayName}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${user.email}</div>
        </div>
      </div>
      <div class="top-menu-item" id="dropdown-sync-btn">
        <span class="icon">🔄</span>
        <span>Sync Now</span>
      </div>
      <div class="top-menu-item" id="dropdown-sign-out-btn">
        <span class="icon">🚪</span>
        <span>Sign Out</span>
      </div>
    `;

    const syncBtn = document.getElementById('dropdown-sync-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        await safeSync();
        alert('✅ Data synced!');
        const dropdown = document.getElementById('top-menu-dropdown');
        if (dropdown) dropdown.classList.remove('active');
      });
    }

    const signOutBtn = document.getElementById('dropdown-sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        signOutUser();
        const dropdown = document.getElementById('top-menu-dropdown');
        if (dropdown) dropdown.classList.remove('active');
      });
    }
  }
}

// Expose functions globally
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.safeSync = safeSync;
window.safeDelete = safeDelete;

// Show login button on load if not signed in
setTimeout(() => {
  if (!currentUser) {
    showLoginButton();
  }
}, 1000);
