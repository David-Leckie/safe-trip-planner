let safeApp;

async function authoriseAndConnect() {
  let appInfo = {
    name: 'Hello SAFE Network',
    id: 'net.maidsafe.tutorials.web-app',
    version: '1.0.0',
    vendor: 'MaidSafe.net Ltd.'
  };
  safeApp = await window.safe.initialiseApp(appInfo);
  console.log('Authorising SAFE application...');
  const authReqUri = await safeApp.auth.genAuthUri(
    {_public: ['Read','Insert','Update','Delete']},
    {own_container: true});
  const authUri = await window.safe.authorise(authReqUri);
  console.log('SAFE application authorised by user');
  await safeApp.auth.loginFromUri(authUri);
  console.log("Application connected to the network");
};

async function checkForMutableData() {
  try {
    ownContainerName = await safeApp.getOwnContainerName();
    ownContainer = await safeApp.auth.getContainer(ownContainerName);
    let keyName = 'storedMD1';
    let selectedMD = await ownContainer.get(keyName);
    return selectedMD;
  }
    catch (err) { 
      return false
    }
}

let storedNameAndTag;

async function getMutableDataAddress() {
  if (await checkForMutableData() == false) {
    console.log("Creating MutableData with initial dataset...");
      const typeTag = 15000;
      md = await safeApp.mutableData.newRandomPublic(typeTag);
      const initialData = {
        "random_key_1": JSON.stringify({
            text: 'Scotland to try Scotch whisky',
            made: false,
          }),
        "random_key_2": JSON.stringify({
            text: 'Patagonia before I\'m too old',
            made: false,
          })
      };
    await md.quickSetup(initialData);
    let nameAndTag = await md.getNameAndTag();
    const entryKey = 'storedMD1'
    const mutations = await safeApp.mutableData.newMutation();
    await mutations.insert(entryKey, JSON.stringify(nameAndTag));
    await ownContainer.applyEntriesMutation(mutations);
    const storedNameAndTag = await ownContainer.get(entryKey);
    return storedNameAndTag;
  }

  else {
    let keyName = 'storedMD1';
    let selectedMD = await ownContainer.get(keyName);
    const value = selectedMD;
      const storedNameAndTag = JSON.parse(value.buf); 
    return storedNameAndTag;
  }

}

async function linkToMutableData() {
  let storedNameAndTag = await getMutableDataAddress();
  linkedMD = await safeApp.mutableData.newPublic(storedNameAndTag.name, storedNameAndTag.typeTag);
}

async function getItems() {
  const entries = await linkedMD.getEntries();
  let entriesList = await entries.listEntries();
  let items = [];
  entriesList.forEach((entry) => {
    const value = entry.value;
    if (value.buf.length == 0) return;
    const parsedValue = JSON.parse(value.buf);
    const stringKey = entry.key.toString();
    items.push({ key: stringKey, value: parsedValue, version: value.version });
  });
  return items;
};

async function getSelectedEntryVersion(radioKey) {
    let selectedEntry = await linkedMD.get(radioKey); 
    return selectedEntry.version
};

async function insertItem(key, value) {
  const mutations = await safeApp.mutableData.newMutation();
  await mutations.insert(key, JSON.stringify(value));
  await linkedMD.applyEntriesMutation(mutations);
};

async function updateItem(key, value, version) {
  const mutations = await safeApp.mutableData.newMutation();
  await mutations.update(key, JSON.stringify(value), version + 1);
  await linkedMD.applyEntriesMutation(mutations);
};

async function deleteItems(items) {
  const mutations = await safeApp.mutableData.newMutation();
  items.forEach(async (item) => {
    await mutations.delete(item.key, item.version + 1);
  });
  await linkedMD.applyEntriesMutation(mutations);
};


module.exports = {
  authoriseAndConnect,
  checkForMutableData,
  getMutableDataAddress,
  linkToMutableData,
  getItems,
  getSelectedEntryVersion,
  insertItem,
  updateItem,
  deleteItems,
};