// Firebase Configuration and Initialization

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, onSnapshot, deleteDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSdHJrT5PC2KPdfbS7k4_LscHG4LGVEtY",
  authDomain: "edu-u-22ebe.firebaseapp.com",
  projectId: "edu-u-22ebe",
  storageBucket: "edu-u-22ebe.firebasestorage.app",
  messagingSenderId: "765734172947",
  appId: "1:765734172947:web:69c6b87068039edf28c2e6",
  measurementId: "G-263RRFEY9J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Export for use in other files
window.firebaseAuth = auth;
window.firestore = firestore;
window.googleProvider = googleProvider;

// Auth state management
let currentUser = null;

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (user) {
    console.log('✅ User signed in:', user.email);
    showUserInfo(user);
    await syncDataFromFirestore();
    setupRealtimeSync();
  } else {
    console.log('❌ User signed out');
    showLoginButton();
  }
});

// Sign in with Google
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('Signed in as:', user.email);
    return user;
  } catch (error) {
    console.error('Sign-in error:', error);
    alert('Failed to sign in. Please try again.');
    return null;
  }
}

// Sign out
async function signOutUser() {
  try {
    await signOut(auth);
    console.log('Signed out successfully');
  } catch (error) {
    console.error('Sign-out error:', error);
  }
}

// Sync local data to Firestore
async function syncDataToFirestore() {
  if (!currentUser) {
    console.log('No user signed in, skipping sync');
    return;
  }

  console.log('📤 Syncing local data to Firestore...');

  const userId = currentUser.uid;

  try {
    // Sync subjects
    const subjects = await db.subjects.toArray();
    for (const subject of subjects) {
      await setDoc(doc(firestore, `users/${userId}/subjects/${subject.id}`), subject);
    }

    // Sync assignments
    const assignments = await db.assignments.toArray();
    for (const assignment of assignments) {
      await setDoc(doc(firestore, `users/${userId}/assignments/${assignment.id}`), assignment);
    }

    // Sync notes
    const notes = await db.notes.toArray();
    for (const note of notes) {
      await setDoc(doc(firestore, `users/${userId}/notes/${note.id}`), note);
    }

    // Sync links
    const links = await db.links.toArray();
    for (const link of links) {
      await setDoc(doc(firestore, `users/${userId}/links/${link.id}`), link);
    }

    // Sync calendar tasks
    const calendarTasks = await db.calendarTasks.toArray();
    for (const task of calendarTasks) {
      await setDoc(doc(firestore, `users/${userId}/calendarTasks/${task.id}`), task);
    }

    console.log('✅ Data synced to Firestore');
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Sync Firestore data to local
async function syncDataFromFirestore() {
  if (!currentUser) return;

  console.log('📥 Syncing data from Firestore...');

  const userId = currentUser.uid;

  try {
    // Sync subjects
    const subjectsSnapshot = await getDocs(collection(firestore, `users/${userId}/subjects`));
    await db.subjects.clear();
    for (const docSnap of subjectsSnapshot.docs) {
      await db.subjects.add(docSnap.data());
    }

    // Sync assignments
    const assignmentsSnapshot = await getDocs(collection(firestore, `users/${userId}/assignments`));
    await db.assignments.clear();
    for (const docSnap of assignmentsSnapshot.docs) {
      await db.assignments.add(docSnap.data());
    }

    // Sync notes
    const notesSnapshot = await getDocs(collection(firestore, `users/${userId}/notes`));
    await db.notes.clear();
    for (const docSnap of notesSnapshot.docs) {
      await db.notes.add(docSnap.data());
    }

    // Sync links
    const linksSnapshot = await getDocs(collection(firestore, `users/${userId}/links`));
    await db.links.clear();
    for (const docSnap of linksSnapshot.docs) {
      await db.links.add(docSnap.data());
    }

    // Sync calendar tasks
    const calendarSnapshot = await getDocs(collection(firestore, `users/${userId}/calendarTasks`));
    await db.calendarTasks.clear();
    for (const docSnap of calendarSnapshot.docs) {
      await db.calendarTasks.add(docSnap.data());
    }

    console.log('✅ Data synced from Firestore');

    // Refresh UI
    if (typeof renderSubjects === 'function') renderSubjects();
    if (typeof renderNotesList === 'function') renderNotesList();
    if (typeof renderCalendar === 'function') renderCalendar();
  } catch (error) {
    console.error('Sync from Firestore error:', error);
  }
}

// Setup real-time sync listeners
function setupRealtimeSync() {
  if (!currentUser) return;

  const userId = currentUser.uid;

  // Listen for subjects changes
  onSnapshot(collection(firestore, `users/${userId}/subjects`), (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'modified' || change.type === 'added') {
        const data = change.doc.data();
        const existing = await db.subjects.get(data.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(data)) {
          await db.subjects.put(data);
          if (typeof renderSubjects === 'function') renderSubjects();
        }
      }
    });
  });

  // Similar listeners for other collections...
  console.log('🔄 Real-time sync enabled');
}

// UI Functions
function showLoginButton() {
  // Create login button in top bar if it doesn't exist
  let loginBtn = document.getElementById('google-login-btn');
  if (!loginBtn) {
    loginBtn = document.createElement('button');
    loginBtn.id = 'google-login-btn';
    loginBtn.className = 'btn btn-primary';
    loginBtn.innerHTML = '🔐 Sign in with Google';
    loginBtn.style.marginLeft = '12px';
    loginBtn.addEventListener('click', signInWithGoogle);

    const topBarActions = document.querySelector('.top-bar-actions');
    topBarActions.insertBefore(loginBtn, topBarActions.firstChild);
  }
  loginBtn.style.display = 'block';

  // Hide user info
  const userInfo = document.getElementById('user-info');
  if (userInfo) userInfo.style.display = 'none';
}

function showUserInfo(user) {
  // Hide login button
  const loginBtn = document.getElementById('google-login-btn');
  if (loginBtn) loginBtn.style.display = 'none';

  // Create or update user info display
  let userInfo = document.getElementById('user-info');
  if (!userInfo) {
    userInfo = document.createElement('div');
    userInfo.id = 'user-info';
    userInfo.style.display = 'flex';
    userInfo.style.alignItems = 'center';
    userInfo.style.gap = '8px';
    userInfo.style.marginLeft = '12px';

    const topBarActions = document.querySelector('.top-bar-actions');
    topBarActions.insertBefore(userInfo, topBarActions.firstChild);
  }

  userInfo.innerHTML = `
    <img src="${user.photoURL}" alt="Profile" style="width: 32px; height: 32px; border-radius: 50%;">
    <span style="font-size: 14px; color: var(--text-primary);">${user.displayName || user.email}</span>
    <button id="sync-now-btn" class="btn btn-secondary btn-sm" title="Sync Now">🔄</button>
    <button id="sign-out-btn" class="btn btn-secondary btn-sm">Sign Out</button>
  `;
  userInfo.style.display = 'flex';

  // Add event listeners
  document.getElementById('sync-now-btn').addEventListener('click', async () => {
    await syncDataToFirestore();
    await syncDataFromFirestore();
    alert('Data synced successfully!');
  });

  document.getElementById('sign-out-btn').addEventListener('click', signOutUser);
}

// Expose functions globally
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.syncDataToFirestore = syncDataToFirestore;
window.syncDataFromFirestore = syncDataFromFirestore;

console.log('🔥 Firebase initialized');
