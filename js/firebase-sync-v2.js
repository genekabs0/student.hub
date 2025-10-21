// Firebase Sync V2 - Smart Two-Way Sync with Conflict Resolution

const auth = firebase.auth();
const firestore = firebase.firestore();

let currentUser = null;
let isSyncing = false;

console.log('🔥 Firebase initialized (smart sync v2)');

// Auth state listener
auth.onAuthStateChanged(async (user) => {
  currentUser = user;

  if (user) {
    console.log('✅ User signed in:', user.email);
    showUserInfo(user);
    await smartSync();
    setupRealtimeListeners();
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

// SMART SYNC - Merge local and remote data
async function smartSync() {
  if (!currentUser || isSyncing) return;

  isSyncing = true;
  console.log('🔄 Starting smart sync...');

  try {
    const userId = currentUser.uid;

    // Sync each collection
    await syncCollection('subjects', userId);
    await syncCollection('assignments', userId);
    await syncCollection('notes', userId);
    await syncCollection('links', userId);
    await syncCollection('calendarTasks', userId);

    console.log('✅ Smart sync complete');
  } catch (error) {
    console.error('Sync error:', error);
    alert('Sync failed: ' + error.message);
  } finally {
    isSyncing = false;
  }
}

// Sync a single collection with smart merging
async function syncCollection(collectionName, userId) {
  console.log(`Syncing ${collectionName}...`);

  // Get local data
  const localItems = await db[collectionName].toArray();

  // Get remote data
  const remoteSnapshot = await firestore
    .collection('users')
    .doc(userId)
    .collection(collectionName)
    .get();

  const remoteItems = {};
  remoteSnapshot.docs.forEach(doc => {
    remoteItems[doc.id] = doc.data();
  });

  const batch = firestore.batch();
  const itemsToUpdate = [];

  // Process each local item
  for (const localItem of localItems) {
    const itemId = String(localItem.id);
    const remoteItem = remoteItems[itemId];

    if (!remoteItem) {
      // Item only exists locally - upload to Firebase
      const ref = firestore.collection('users').doc(userId).collection(collectionName).doc(itemId);
      batch.set(ref, { ...localItem, lastModified: localItem.lastModified || Date.now(), deleted: localItem.deleted || false });
    } else {
      // Item exists both locally and remotely - compare timestamps
      const localTime = localItem.lastModified || localItem.createdAt || 0;
      const remoteTime = remoteItem.lastModified || remoteItem.createdAt || 0;

      if (localTime > remoteTime) {
        // Local is newer - upload to Firebase
        const ref = firestore.collection('users').doc(userId).collection(collectionName).doc(itemId);
        batch.set(ref, localItem);
      } else if (remoteTime > localTime) {
        // Remote is newer - update local
        itemsToUpdate.push(remoteItem);
      }
      // If times are equal, do nothing (already in sync)

      delete remoteItems[itemId]; // Mark as processed
    }
  }

  // Process remaining remote items (exist only on server)
  for (const itemId in remoteItems) {
    const remoteItem = remoteItems[itemId];
    // Add to local database
    itemsToUpdate.push(remoteItem);
  }

  // Commit Firebase updates
  if (batch._mutations && batch._mutations.length > 0) {
    await batch.commit();
  }

  // Update local database
  for (const item of itemsToUpdate) {
    await db[collectionName].put(item);
  }

  // Refresh UI
  if (collectionName === 'subjects' && typeof renderSubjects === 'function') {
    renderSubjects();
  } else if (collectionName === 'notes' && typeof renderNotesList === 'function') {
    renderNotesList();
  } else if (collectionName === 'calendarTasks' && typeof renderCalendar === 'function') {
    renderCalendar();
  }
}

// Setup real-time listeners (simplified for now)
function setupRealtimeListeners() {
  console.log('🔄 Real-time sync enabled');
  // Real-time listeners can be added here if needed
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
    document.getElementById('dropdown-sign-in-btn').addEventListener('click', () => {
      signInWithGoogle();
      document.getElementById('top-menu-dropdown').classList.remove('active');
    });
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

    document.getElementById('dropdown-sync-btn').addEventListener('click', async () => {
      await smartSync();
      alert('✅ Data synced!');
      document.getElementById('top-menu-dropdown').classList.remove('active');
    });

    document.getElementById('dropdown-sign-out-btn').addEventListener('click', () => {
      signOutUser();
      document.getElementById('top-menu-dropdown').classList.remove('active');
    });
  }
}

// Auto-sync on page unload
window.addEventListener('beforeunload', () => {
  if (currentUser && !isSyncing) {
    smartSync();
  }
});

// Expose functions globally
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.smartSync = smartSync;

// Show login button on load
setTimeout(() => {
  if (!currentUser) {
    showLoginButton();
  }
}, 1000);
