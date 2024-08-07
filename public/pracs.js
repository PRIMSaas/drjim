import {
    auth, setUser, currentUser, setProviders, getPractitioners, getServiceCodes, clinicId,
    getStore, clearStore,
    missingProvidersKey, missingServiceCodes
} from './firebase.js';
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
        populatePracs();
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

let serviceCodes
function populatePracs() {
    const cId = localStorage.getItem(clinicId);
    const userId = currentUser.email;
    getPractitioners(userId, cId).then((lstProviders) => {
        if (lstProviders.error) {
            alert(lstProviders.error);
        }
        getServiceCodes(currentUser.email, cId).then((lstServiceCodes) => {
            if (lstServiceCodes.error) {
                alert(lstServiceCodes.error);
            }
            serviceCodes = lstServiceCodes.data
            if (lstProviders && lstProviders.data.length > 0) {
                for (const [index, provider] of lstProviders.data.entries()) {
                    let serviceMap = []
                    if (provider.services) {
                        serviceMap = provider.services.reduce((map, service) => {
                            map[service.id] = service.value;
                            return map;
                        }, {});
                    }
                    fillPracs(provider.id, provider.name, serviceMap)
                }
            }
            populateMissingPracs();
            highlightMissingServiceCodes();
            fillPracs(null, null, null)
        });
    })
}

function populateMissingPracs() {
    const missing = getStore(missingProvidersKey);
    if (missing && missing !== 'null' && missing !== 'undefined') {
        const missingProviders = JSON.parse(missing);
        if (missingProviders && Object.keys(missingProviders).length > 0) {
            for (const key of Object.keys(missingProviders)) {
                fillPracs(null, key, null)
            }
        }
    }
    clearStore(missingProvidersKey);
}

function highlightMissingServiceCodes() {
    const missing = getStore(missingServiceCodes);
    if (missing && missing !== 'null' && missing !== 'undefined') {
        const missingProvidersServiceCodes = JSON.parse(missing);
        if (missingProvidersServiceCodes && Object.keys(missingProvidersServiceCodes).length > 0) {
            for (const key of Object.keys(missingProvidersServiceCodes)) {
                const providerRows = document.getElementsByClassName('providerRow');
                for (let i = 0; i < providerRows.length; i++) {
                    const nameInput = providerRows[i].getElementsByClassName('name-input')[0];
                    if (nameInput.value === key) {
                        const serviceCodeInputs = providerRows[i].getElementsByClassName('service-code');
                        const serviceNumbers = providerRows[i].getElementsByClassName('percentage-number');
                        for (let j = 0; j < serviceCodeInputs.length; j++) {
                            if (serviceCodeInputs[j].id in missingProvidersServiceCodes[key]) {
                                serviceCodeInputs[j].style.backgroundColor = 'yellow';
                                serviceNumbers[j].style.backgroundColor = 'yellow';
                            }
                        }
                    }
                }
            }
        }
    }
    clearStore(missingServiceCodes);
}

const providerRow = 'providerRow';
const serviceCodeEntry = 'service-code-entry';
const providerForm = 'provider-form';
const submitButton = document.getElementById('submitButton');
const cancelButton = document.getElementById('cancelButton');

function fillPracs(pid, pname, servicesMap) {
    const section = document.createElement('div');
    section.classList.add(providerRow);
    section.style.display = 'inline-flex';
    section.style.flexWrap = 'wrap';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'name-input';
    nameInput.style.marginBottom = '10px';
    if (pname) {
        nameInput.value = pname;
    }
    nameInput.setAttribute('data-id', pid);
    section.appendChild(nameInput);

    // Create a new input element for service code
    const serviceCodeInput = addServiceCode(servicesMap);
    section.appendChild(serviceCodeInput);

    // Create a new button element
    const buttonElement = document.createElement('button');
    buttonElement.textContent = 'Delete';
    buttonElement.style.marginBottom = '10px';
    addDeleteButtonHandler(buttonElement, form.childElementCount);
    section.appendChild(buttonElement);

    const nameEntry = document.getElementById(providerForm);
    nameEntry.appendChild(section);
}

function addDeleteButtonHandler(deleteButton, index) {
    deleteButton.addEventListener('click', async () => {
        const sections = Array.from(document.getElementById(providerForm).children);
        if (index < sections.length - 1) {
            sections[index].parentElement.removeChild(sections[index]);
        } else {
            alert('Please select valid provider to delete');
        }
    });
}

function addServiceCode(servicesMap) {
    const newSection = document.createElement('div');
    newSection.classList.add(serviceCodeEntry);

    for (const id in serviceCodes) {
        const inputContainer = document.createElement('div');
        inputContainer.style.display = 'inline-block';
        inputContainer.style.marginBottom = '10px';

        const serviceCodeInput = document.createElement('label');
        serviceCodeInput.className = 'service-code';
        serviceCodeInput.textContent = serviceCodes[id].id + "-" + serviceCodes[id].description;
        serviceCodeInput.setAttribute('id', serviceCodes[id].id);
        inputContainer.appendChild(serviceCodeInput);

        const newServiceNumber = document.createElement('input');
        newServiceNumber.type = 'number';
        newServiceNumber.classList.add('percentage-number');
        newServiceNumber.value = servicesMap ? servicesMap[serviceCodes[id].id] : '';
        inputContainer.appendChild(newServiceNumber);

        const percentageSymbol = document.createElement('span');
        percentageSymbol.textContent = ' %';
        inputContainer.appendChild(percentageSymbol);
        newSection.appendChild(inputContainer);
    }
    return newSection;
}

const form = document.getElementById(providerForm);
document.addEventListener('input', function (event) {
    // If the input event was triggered by a name input field
    if (event.target.classList.contains('name-input')) {
        const section = event.target.parentElement;
        // If the input is filled in and the section is the last one
        if (event.target.value && section === form.lastElementChild) {
            fillPracs(null, null, null);
        }
    }
});

submitButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const providerRows = document.getElementsByClassName('providerRow');
    const providers = [];

    let clearToClear = true;
    for (let i = 0; i < providerRows.length; i++) {
        const nameInput = providerRows[i].getElementsByClassName('name-input')[0];
        let idValue = nameInput.getAttribute('data-id');
        idValue = (idValue === 'null' || idValue === null) ? '' : idValue;

        if (nameInput.value !== '') {
            const providerData = {
                id: idValue,
                name: nameInput.value,
                services: []
            };

            const serviceCodeInputs = providerRows[i].getElementsByClassName('service-code');
            const serviceNumbers = providerRows[i].getElementsByClassName('percentage-number');

            for (let j = 0; j < serviceCodeInputs.length; j++) {
                const value = serviceNumbers[j].value;
                let notError = true
                if (value !== '') {
                    const numericValue = parseFloat(value);
                    if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
                        // Highlight the field with the error
                        serviceNumbers[j].style.backgroundColor = 'red';
                        displayErrors(`Error: Service number value must be blank or between 0 and 100. Found: ${value}`);
                        notError = false;
                        clearToClear = false;
                    }
                }
                if (notError) {
                    serviceNumbers[j].style.backgroundColor = '';
                    providerData.services.push({
                        id: serviceCodeInputs[j].id,
                        value: value
                    });
                }
            }
            providers.push(providerData);
        }
    }
    const cId = localStorage.getItem(clinicId);
    const userId = currentUser.email;
    setProviders(userId, cId, providers)
        .then(() => { if (clearToClear) { entryComplete() } })
        .catch(error => displayErrors(`Error setting practitioners: ${error}`));
});

cancelButton.addEventListener('click', async (e) => {
    e.preventDefault();
    entryComplete();
});

function entryComplete() {
    window.location.href = '/dashboard.html';
}
function displayErrors(error) {
    messageOutput.innerText = error
    messageOutput.style.color = 'red';
}

