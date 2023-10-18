import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, set, get, child, push, onValue, off } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
import { initDrawing, clear, fill, drawText, drawArrow } from "./drawing.js";
import { Text } from "./text.js";

const firebaseConfig = {
    apiKey: "AIzaSyATN26E176oe_47PjetFmHMYYFYuJ55qZg",
    authDomain: "branches-73eec.firebaseapp.com",
    projectId: "branches-73eec",
    storageBucket: "branches-73eec.appspot.com",
    messagingSenderId: "620842309823",
    appId: "1:620842309823:web:8f9d79f181c7a357f9ce0a",
    measurementId: "G-K0QN1BEKVY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase();

// Create canvas
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
initDrawing(ctx, canvas);

// Currently viewed text
let storedPassage = localStorage.getItem("currPassage");
let currPassage = storedPassage == undefined ? 0 : storedPassage;
let currChild = 0;
let currRef, currData;
let loading = true;
let waitingForChildren;
let onChildrenLoaded;
let currChildrenTexts;
gotoPassage(currPassage, () => {
    currChild = Math.floor(currData.children.length / 2);
    setChildPositionsImmediate();
});

// Total number of passages (for assigning new indices)
let countRef = ref(database, "count");
let count = 0;
onValue(countRef, (snapshot) => {
    count = snapshot.val();
});

// Creating a new passage
let creatingNew = false;
let newPassage = {
    parent: undefined,
    text: ""
};

// Text objects
let childTextPool = [];
for (let i = 0; i < 6; i++) {
    childTextPool.push(new Text());
    childTextPool[i].wrapWidth = 0.35;
    childTextPool[i].b = 255;
}

let instructionText = new Text();
instructionText.wrapWidth = 0.9;
instructionText.setAlphaImmediate(0.5);
instructionText.setXImmediate(0.5);
instructionText.setYImmediate(0.05);

let mainText = new Text();
mainText.setXImmediate(0.5);
mainText.setYImmediate(0.3);
mainText.wrapWidth = 0.35;

// Loop
setInterval(loop, 16.666666);
function loop() {
    // Clear screen, set fill to black
    clear();
    fill("#000");

    // If data isn't loaded, just display loading screen
    if (!currData || loading) {
        if (waitingForChildren <= 0) {
            loading = false;
            for (let i = 0; i < childTextPool.length; i++)
                childTextPool[i].alpha = 0;
            if (!creatingNew)
                mainText.alpha = 0;
            onChildrenLoaded();
        }
        if (!creatingNew) {
            instructionText.text = "Loading...";
            drawTextObjs(instructionText);
            return;
        }
    }

    // If creating a new passage
    if (creatingNew) {
        mainText.text = newPassage.text;
        instructionText.text = "Type a new passage, and press enter to add it. (Up arrow to cancel.) (" + newPassage.text.length + "/120 characters)";
        drawTextObjs(mainText, instructionText);
        return;
    }

    // Draw current text
    mainText.text = currData.text;

    // Draw current children
    setChildPositions();

    // Instruction text
    instructionText.text = "Use the arrow keys to navigate.";

    drawTextObjs(mainText, instructionText, childTextPool);
    drawArrow(0.5, 0.5);
}

// Keypresses
document.addEventListener('keydown', (event) => {
    // No input during loading screens
    if (loading) {
        return;
    }

    // When creating a new passage
    if (creatingNew) {
        if (event.key == "Enter") {
            let newID = count;
            set(ref(database, "" + newID), newPassage).then(() => {
                off(currRef);
                set(child(currRef, "children/" + currData.children.length), newID);
                gotoPassage(newID);
                currChild = 0;
                count++;
                set(countRef, count);
            });
            creatingNew = false;
        } else if (event.key.length == 1 && newPassage.text.length < 120) {
            newPassage.text += event.key;
        } else if (event.key == "Backspace") {
            newPassage.text = newPassage.text.substring(0, newPassage.text.length - 1);
        } else if (event.key == "ArrowUp") {
            creatingNew = false;
        }
        event.preventDefault();
        return;
    }

    // When navigating through passages
    if (event.key == "ArrowRight" && currChild < currChildrenTexts.length) {
        currChild++;
        event.preventDefault();
    } else if (event.key == "ArrowLeft" && currChild > 0) {
        currChild--;
        event.preventDefault();
    } else if (event.key == "ArrowDown") {
        // Creating a new branch
        if (currChild == currChildrenTexts.length) {
            creatingNew = true;
            clearNewPassage();
        } else {
            gotoPassage(currData.children[currChild], () => {
                currChild = Math.floor(currData.children.length / 2);
                setChildPositionsImmediate();
            });
            currChild = 0;
            localStorage.setItem("currPassage", currPassage);
        }
        event.preventDefault();
    } else if (event.key == "ArrowUp" && currData.parent != undefined) {
        let prev = currPassage;
        gotoPassage(currData.parent, () => {
            for (let i = 0; i < currData.children.length; i++) {
                if (currData.children[i] == prev) {
                    currChild = i;
                    break;
                }
            }
            setChildPositionsImmediate();
        });
        localStorage.setItem("currPassage", currPassage);
        event.preventDefault();
    }
}, false);

// Helpers
function setChildPositions() {
    for (let i = 0; i < childTextPool.length; i++) {
        if (i < currChildrenTexts.length) {
            childTextPool[i].text = currChildrenTexts[i];
        } else if (i == currChildrenTexts.length) {
            childTextPool[i].text = "+ (new branch)";

        } else {
            childTextPool[i].text = "";
        }
        childTextPool[i].targetAlpha = 1 - Math.abs(i - currChild) * 0.75;
        childTextPool[i].targetX = 0.5 + (i - currChild) * 0.4;
        childTextPool[i].targetY = 0.7;
    }
}

function setChildPositionsImmediate() {
    for (let i = 0; i < childTextPool.length; i++) {
        if (i < currChildrenTexts.length) {
            childTextPool[i].text = currChildrenTexts[i];
        } else if (i == currChildrenTexts.length) {
            childTextPool[i].text = "+ (new branch)";
        } else {
            childTextPool[i].text = "";
        }
        childTextPool[i].setXImmediate(0.5 + (i - currChild) * 0.4)
        childTextPool[i].setYImmediate(0.7);
    }
}

function isArray(myArray) {
    return myArray.constructor === Array;
}

function clearNewPassage() {
    newPassage.text = "";
    newPassage.parent = currPassage;
}

function gotoPassage(id, callback) {
    if (currRef)
        off(currRef);
    currPassage = id;
    currRef = ref(database, "" + id);
    currChildrenTexts = [];
    loading = true;
    waitingForChildren = 1;
    onValue(currRef, (snapshot) => {
        currData = snapshot.val();
        if (currData.children == undefined)
            currData.children = [];

        // Load child data for displaying text
        loading = true;
        currChildrenTexts = [];
        waitingForChildren = currData.children.length;
        for (let i = 0; i < currData.children.length; i++) {
            get(ref(database, "" + currData.children[i])).then((snapshot) => {
                waitingForChildren--;
                currChildrenTexts.push(snapshot.val().text);
            });
        }

        onChildrenLoaded = callback;
    });
}

function drawTextObjs(...objs) {
    for (let i = 0; i < objs.length; i++) {
        if (isArray(objs[i])) {
            for (let j = 0; j < objs[i].length; j++) {
                objs[i][j].draw();
            }
        } else {
            objs[i].draw();
        }
    }
}