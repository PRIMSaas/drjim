import { auth, setUser, currentUser, getClinics, setClinics } from './firebase.js';
import {
    islogoutButtonPressed,
    resetlogoutButtonPressed,
    showLoginScreen,
    showUser
} from './footer.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

onAuthStateChanged(auth, (user) => {
    if (user) {
        setUser(user);
        showUser(user)
        populateClinic();
    } else {
        // User is signed out
        if (islogoutButtonPressed()) {
            resetlogoutButtonPressed();
        } else {
            alert("Please sign in first")
        }
        showLoginScreen()
    }
});

function populateClinic() {

    getClinics().then((result) => {
        if (result.error) {
            alert(result.error);
        }
        const clinics = result.data;
        if (clinics) {
            for (const [index, clinic] of clinics.entries()) {
                createCompanyAddressSection(index, clinic.id, clinic.name, clinic.address, clinic.abn[index], clinic.postcode[index], clinic.serviceFee[index]);
            }
        }
        addBlankClinicAtBottom()
    });
}

const form = document.getElementById('company-form');

function addBlankClinicAtBottom() {
    const currentSections = form.getElementsByClassName('company-address-section');
    const nextIndex = currentSections.length;
    createCompanyAddressSection(nextIndex, null, null);
}

// Function to create a new company and address section
function createCompanyAddressSection(index, id, name, address, abn, postcode, fee) {
    const section = document.createElement('div');
    section.classList.add('company-address-section');

    const documentIdLabel = document.createElement('label');
    documentIdLabel.textContent = id;
    documentIdLabel.style.display = 'none';
    documentIdLabel.classList.add('docId');
    section.appendChild(documentIdLabel);
    section.appendChild(document.createElement('br'));

    const companyNameLabel = document.createElement('label');
    companyNameLabel.textContent = 'Clinic Name*:';
    section.appendChild(companyNameLabel);
    section.appendChild(document.createElement('br'));

    const companyNameInput = document.createElement('input');
    companyNameInput.type = 'text';
    companyNameInput.classList.add('companyName');
    companyNameInput.name = 'companyName';
    if (name) {
        companyNameInput.value = name;
    }
    section.appendChild(companyNameInput);
    section.appendChild(document.createElement('br'));

    const companyAbnLabel = document.createElement('label');
    companyAbnLabel.textContent = 'Company ABN*:';
    section.appendChild(companyAbnLabel);
    section.appendChild(document.createElement('br'));
    const companyAbn = document.createElement('input');
    companyAbn.type = 'text';
    companyAbn.classList.add('companyAbn');
    companyAbn.name = 'companyAbn';
    if (abn) {
        companyAbn.value = abn;
    }
    section.appendChild(companyAbn);
    section.appendChild(document.createElement('br'));

    const addressLabel = document.createElement('label');
    addressLabel.textContent = 'Address*:';
    section.appendChild(addressLabel);
    section.appendChild(document.createElement('br'));

    const addressInput = document.createElement('input');
    addressInput.type = 'text';
    addressInput.classList.add('address');
    addressInput.name = 'address';
    if (address) {
        addressInput.value = address;
    }
    section.appendChild(addressInput);
    section.appendChild(document.createElement('br'));

    const companyPostCodeLabel = document.createElement('label');
    companyPostCodeLabel.textContent = 'Company Postcode:';
    section.appendChild(companyPostCodeLabel);
    section.appendChild(document.createElement('br'));
    const companyPostCode = document.createElement('input');
    companyPostCode.type = 'text';
    companyPostCode.classList.add('companyPostCode');
    companyPostCode.name = 'companyPostCode';
    if (postcode) {
        companyPostCode.value = postcode;
    }
    section.appendChild(companyPostCode);
    section.appendChild(document.createElement('br'));

    const lineNumberLabel = document.createElement('label');
    lineNumberLabel.textContent = 'Line Number:';
    section.appendChild(lineNumberLabel);
    section.appendChild(document.createElement('br'));
    const lineNumber = document.createElement('input');
    lineNumber.type = 'text';
    lineNumber.classList.add('lineNumber');
    lineNumber.name = 'lineNumber';
    if (fee) {
        lineNumber.value = fee;
    }
    section.appendChild(lineNumber);

    section.appendChild(document.createElement('br'));
    section.appendChild(document.createElement('br'));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete');
    section.appendChild(deleteButton);
    section.appendChild(document.createElement('br'));
    section.appendChild(document.createElement('br'));
    addDeleteButtonHandler(deleteButton, index);

    const div = document.getElementById('company-form');
    div.appendChild(section);
    return section;
}

function addDeleteButtonHandler(deleteButton, index) {
    deleteButton.addEventListener('click', async() => {
        const sections = Array.from(form.getElementsByClassName('company-address-section'));
        if (index < sections.length - 1) {
            sections[index].parentElement.removeChild(sections[index]);
        } else {
            alert('Please select a filled in clinic to delete');
        }
    });
}

newClinicButton.addEventListener('click', async (e) => {
    e.preventDefault();
    addBlankClinicAtBottom();
})

submitButton.addEventListener('click', async (e) => {
    e.preventDefault();

    const companyNameField = form.getElementsByClassName('companyName');
    const addressField = form.getElementsByClassName('address');
    const abnField = form.getElementsByClassName('companyAbn');
    if(companyNameField.value == undefined || addressField.value == undefined || abnField.value == undefined){
        alert("Please fill in required fields")
    } else {
        // Get the form values, exclude empty fields
        const docNames = Array.from(form.getElementsByClassName('docId'), label => label.textContent);
        const companyNames = Array.from(companyNameField, input => input.value.trim()).filter(value => value !== '');
        const addresses = Array.from(addressField, input => input.value.trim()).filter(value => value !== '');
        const companyAbn = Array.from(abnField, input => input.value.trim()).filter(value => value !== '');
        const companyPostCode= Array.from(form.getElementsByClassName('companyPostCode'), input => input.value.trim()).filter(value => value !== '');
        const lineNumber = Array.from(form.getElementsByClassName('lineNumber'), input => input.value.trim()).filter(value => value !== '');    
        
        const companies = companyNames.map((name, i) => ({
            docId: docNames[i], name: companyNames[i], address: addresses[i], 
            abn: companyAbn[i], postcode: companyPostCode[i], lineNumber: lineNumber[i]
        }));
        let companiesArray = companies.map(company => ({            
            id: company.docId,
            name: company.name,
            address: company.address,
            abn: companyAbn,
            postcode: companyPostCode,
            lineNumber: lineNumber
        }));
        
        const userId = currentUser.uid; 
        const errorMsg = await setClinics(userId, companiesArray);
         if (errorMsg) {
            alert(errorMsg);
        } else {
            entryComplete();
        }
    }
});

cancelButton.addEventListener('click', async (e) => {
    e.preventDefault();
    entryComplete();
});

function entryComplete() {
    window.location.href = '/dashboard.html';
}

