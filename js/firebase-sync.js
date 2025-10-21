// Firebase Sync - Compat version (works with file://)

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSdHJrT5PC2KPdfbS7k4_LscHG4LGVEtY",
  authDomain: "edu-u-22ebe.firebaseapp.com",
  projectId: "edu-u-22ebe",
  storageBucket: "edu-u-22ebe.firebasestorage.app",
  messagingSenderId: "765734172947",
  appId: "1:765734172947:web:69c6b87068039edf28c2e6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();

let currentUser = null;
let isSyncing = false;

console.log('🔥 Firebase initialized (compat mode)');

// Auth state listener
auth.onAuthStateChanged(async (user) => {
  currentUser = user;

  if (user) {
    console.log('✅ User signed in:', user.email);
    showUserInfo(user);
    await syncFromFirestore();
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

// Sync local data to Firestore
async function syncToFirestore() {
  if (!currentUser || isSyncing) return;

  isSyncing = true;
  console.log('📤 Syncing to Firestore...');

  try {
    const userId = currentUser.uid;
    const batch = firestore.batch();

    // Sync subjects
    const subjects = await db.subjects.toArray();
    subjects.forEach(subject => {
      const ref = firestore.collection('users').doc(userId).collection('subjects').doc(String(subject.id));
      batch.set(ref, subject);
    });

    // Sync assignments
    const assignments = await db.assignments.toArray();
    assignments.forEach(assignment => {
      const ref = firestore.collection('users').doc(userId).collection('assignments').doc(String(assignment.id));
      batch.set(ref, assignment);
    });

    // Sync notes
    const notes = await db.notes.toArray();
    notes.forEach(note => {
      const ref = firestore.collection('users').doc(userId).collection('notes').doc(String(note.id));
      batch.set(ref, note);
    });

    // Sync links
    const links = await db.links.toArray();
    links.forEach(link => {
      const ref = firestore.collection('users').doc(userId).collection('links').doc(String(link.id));
      batch.set(ref, link);
    });

    // Sync calendar tasks
    const calendarTasks = await db.calendarTasks.toArray();
    calendarTasks.forEach(task => {
      const ref = firestore.collection('users').doc(userId).collection('calendarTasks').doc(String(task.id));
      batch.set(ref, task);
    });

    await batch.commit();
    console.log('✅ Synced to Firestore');
  } catch (error) {
    console.error('Sync error:', error);
    alert('Sync failed: ' + error.message);
  } finally {
    isSyncing = false;
  }
}

// Sync Firestore data to local
async function syncFromFirestore() {
  if (!currentUser || isSyncing) return;

  isSyncing = true;
  console.log('📥 Syncing from Firestore...');

  try {
    const userId = currentUser.uid;

    // Sync subjects
    const subjectsSnapshot = await firestore.collection('users').doc(userId).collection('subjects').get();
    if (!subjectsSnapshot.empty) {
      await db.subjects.clear();
      for (const doc of subjectsSnapshot.docs) {
        const data = doc.data();
        await db.subjects.put(data); // Use put() to preserve IDs
      }
    }

    // Sync assignments
    const assignmentsSnapshot = await firestore.collection('users').doc(userId).collection('assignments').get();
    if (!assignmentsSnapshot.empty) {
      await db.assignments.clear();
      for (const doc of assignmentsSnapshot.docs) {
        const data = doc.data();
        await db.assignments.put(data); // Use put() to preserve IDs
      }
    }

    // Sync notes
    const notesSnapshot = await firestore.collection('users').doc(userId).collection('notes').get();
    if (!notesSnapshot.empty) {
      await db.notes.clear();
      for (const doc of notesSnapshot.docs) {
        const data = doc.data();
        await db.notes.put(data); // Use put() to preserve IDs
      }
    }

    // Sync links
    const linksSnapshot = await firestore.collection('users').doc(userId).collection('links').get();
    if (!linksSnapshot.empty) {
      await db.links.clear();
      for (const doc of linksSnapshot.docs) {
        const data = doc.data();
        await db.links.put(data); // Use put() to preserve IDs
      }
    }

    // Sync calendar tasks
    const calendarSnapshot = await firestore.collection('users').doc(userId).collection('calendarTasks').get();
    if (!calendarSnapshot.empty) {
      await db.calendarTasks.clear();
      for (const doc of calendarSnapshot.docs) {
        const data = doc.data();
        await db.calendarTasks.put(data); // Use put() to preserve IDs
      }
    }

    console.log('✅ Synced from Firestore');

    // Refresh UI
    if (typeof renderSubjects === 'function') renderSubjects();
    if (typeof renderNotesList === 'function') renderNotesList();
    if (typeof renderCalendar === 'function') renderCalendar();
  } catch (error) {
    console.error('Sync from Firestore error:', error);
  } finally {
    isSyncing = false;
  }
}

// Setup real-time listeners
function setupRealtimeListeners() {
  if (!currentUser) return;

  const userId = currentUser.uid;

  // Listen to subjects changes
  firestore.collection('users').doc(userId).collection('subjects').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added' || change.type === 'modified') {
        const data = change.doc.data();
        await db.subjects.put(data);
        if (typeof renderSubjects === 'function') renderSubjects();
      } else if (change.type === 'removed') {
        const data = change.doc.data();
        await db.subjects.delete(data.id);
        if (typeof renderSubjects === 'function') renderSubjects();
      }
    });
  });

  console.log('🔄 Real-time sync enabled');
}

// UI Functions
function showLoginButton() {
  // Login button in dropdown (both desktop and mobile)
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

  const userInfo = document.getElementById('user-info');
  if (userInfo) userInfo.style.display = 'none';
}

function showUserInfo(user) {
  const displayName = user.displayName || user.email.split('@')[0];

  // User info in dropdown (both desktop and mobile)
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
      await syncToFirestore();
      await syncFromFirestore();
      alert('✅ Data synced!');
      document.getElementById('top-menu-dropdown').classList.remove('active');
    });

    document.getElementById('dropdown-sign-out-btn').addEventListener('click', () => {
      signOutUser();
      document.getElementById('top-menu-dropdown').classList.remove('active');
    });
  }
}

// Auto-sync when data changes
window.addEventListener('beforeunload', () => {
  if (currentUser) {
    syncToFirestore();
  }
});

// Expose functions globally
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.syncToFirestore = syncToFirestore;
window.syncFromFirestore = syncFromFirestore;

// Show login button on load
setTimeout(() => {
  if (!currentUser) {
    showLoginButton();
  }
}, 1000);
