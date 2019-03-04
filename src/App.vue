<script>
  const safenetwork = require('./safenetwork_interface.js');
  export default {
    name: 'App',
    data() {
      return {tripText: '', trips: [], newText: [],}
    },
    methods: {
      refreshList: async function() {
        this.trips = await safenetwork.getItems();
      },
      textChange: async function(typing) {
        this.newText = await typing;
      },
      addTrip: async function() {
        const randomNumber = Math.floor((Math.random() * 10000) + 1);
        const randomKey = randomNumber.toString();
        await safenetwork.insertItem(randomKey, {text: this.tripText, made: false});
        this.newText = [];
        await this.refreshList();
      },
      selectTrip: async function(radioTrip) {
        if (this.newText == true) {
          if (confirm("Discard Changes?") == true) {
            this.newText = [];
            this.radioKey = await radioTrip.key;
            this.tripText = await radioTrip.value.text;
          }
          else {
            return;
          }  
        }
        else {
          this.radioKey = await radioTrip.key;
          this.tripText = await radioTrip.value.text;
        }
      },
      editTrip: async function() {
        try {
          this.selectedVersion = await safenetwork.getSelectedEntryVersion(this.radioKey);
          await safenetwork.updateItem(this.radioKey, {text: this.tripText, made: false}, this.selectedVersion);
          let savedMessage = document.getElementById("savedMessage");
          savedMessage.className = "show";
          setTimeout(function(){ savedMessage.className = savedMessage.className.replace("show", ""); },1200);
          this.newText = [];
        }
        catch (err) {
          alert ("No Trip Selected!\n\nAdd New Trip or Select From List...\n")
        }
        await this.refreshList();
      },
      clearTextBox: async function() {
        if (this.newText == true) {
          if (confirm ("Discard Changes?")==true) {
            this.newText = [];
            this.radioKey = '';
            this.tripText = '';
           }
           else {
             return;
           }
        }
        else {
          this.radioKey = '';
          this.tripText = '';
        }
      },
      remaining: function() {
        var count = 0;
        this.trips.forEach((trip) => {
          count += trip.value.selected ? 0 : 1;
        });
        return count;
      },
      remove: async function() {
        let tripsToRemove = []
        await this.trips.forEach(async (trip) => {
          if (trip.value.made) {
            tripsToRemove.push({ key: trip.key, version: trip.version });
          }
        });
        if (tripsToRemove.length > 0) {
          await safenetwork.deleteItems(tripsToRemove);
          await this.refreshList();
        }
      }
    },
    async created() {
      await safenetwork.authoriseAndConnect();
      await safenetwork.checkForMutableData();
      await safenetwork.getMutableDataAddress();
      await safenetwork.linkToMutableData();
      await this.refreshList();
    }
  };
  
</script>

<style scoped>
.made-true {
  text-decoration: line-through;
  color: grey;
}
#savedMessage {
  visibility: hidden;
  color: #33cc33;
}
#savedMessage.show {
  visibility: visible;
}
</style>

<template>
  <div :class="$style.App">
    <h1>Hello SAFE Network!</h1>
    <h2>Davids Trip Planner</h2>
    <div>
      <span>{{remaining()}} of {{trips.length}} trips remaining</span>
      [ <a href="" v-on:click.prevent="remove">Delete Selected Trips</a> ]
        <form>
          <ul>
            <li v-for="trip in trips">
              <input class="btn" type = "submit" name= "radioTrip" value = "Edit" v-on:click.prevent="selectTrip(trip)">
              <label class="checkbox">
                <input type="checkbox" v-model="trip.value.made">
                <span v-bind:class="{ 'made-true' : trip.value.made }">{{trip.value.text}}</span><br>
              </label>
            </li>
          </ul>
            <textarea type="text" id="textBox" v-model="tripText" @input="textChange(true)" size="150" 
            placeholder=""></textarea>
            <input class="btn-primary" type="submit" id= "addBtn" value="Add Trip" v-on:click.prevent="addTrip">
            <input class="btn-primary" type="submit" id= "editBtn" value="Save Changes" v-on:click.prevent="editTrip">
            <input class="btn-primary" type="submit" id= "clearBtn" value="Clear" v-on:click.prevent="clearTextBox">
            <p></p>    
        </form>
    </div> 
<div id="savedMessage">Saved</div>
</div>
</template>

<style module>
  .App {
    padding: 20px;
  }
</style>
