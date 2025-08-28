
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth , createUserWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
const firebaseConfig = {
    apiKey: "AIzaSyBm0rNRQ3dHfmEi5fR-kbNyiey53VBdrl4",
    authDomain: "web-app-prototype-175d7.firebaseapp.com",
    projectId: "web-app-prototype-175d7",
    storageBucket: "web-app-prototype-175d7.firebasestorage.app",
    messagingSenderId: "840082341674",
    appId: "1:840082341674:web:de201da08caaee9f4b6853",
    measurementId: "G-CR8B8JHHST"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const form = document.getElementById("login-form");
const formArea = document.getElementById("form-area");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value;
    const password = form.password.value;
    console.log(email, password);
    console.log('ส่งข้อมูลแล้ว');
    alert('ส่งข้อมูลสำเร็จ');
});