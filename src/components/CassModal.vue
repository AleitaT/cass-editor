<template>
    <div
        class="modal is-small"
        :class="[{'is-active': visible}, modalClass]">
        <div class="modal-background" />
        <div class="modal-card">
            <header
                class="modal-card-head"
                :class="modalHeaderBackground">
                <p
                    class="subtitle is-size-3 modal-card-title"
                    :class="modalHeaderFontColor">
                    {{ title }}

                    <button
                        class="delete is-pulled-right"
                        aria-label="close"
                        @click="cancel()" />
                </p>
            </header>
            <div class="modal-card-body has-text-dark">
                {{ text }}
            </div>
            <section
                v-if="type==='export'"
                class="modal-card-body has-text-dark">
                <div
                    v-if="type === 'export'"
                    class="field">
                    <div class="control">
                        <div class="select is-primary is-fullwidth">
                            <select v-model="selectedExportOption">
                                <option
                                    selected
                                    value>
                                    Select an option
                                </option>
                                <option
                                    v-for="(option, index) in exportOptions"
                                    :value="option.value"
                                    :key="index">
                                    {{ option.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>
            <section
                v-else-if="options"
                class="modal-card-body has-text-dark">
                <div
                    class="field">
                    <div class="control">
                        <div class="select is-primary is-fullwidth">
                            <select v-model="selectedOption">
                                <option
                                    selected
                                    disabled
                                    value="">
                                    Select an option
                                </option>
                                <option
                                    v-for="(option, index) in options"
                                    :value="option"
                                    :key="index">
                                    {{ option }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
                <input
                    class="input"
                    placeholder="Enter a new name"
                    v-if="selectedOption==='Choose another name'"
                    v-model="newName">
                <div v-if="invalid">
                    The name you chose is already in the system. Please try a different name.
                </div>
            </section>
            <footer class="modal-card-foot has-background-white">
                <div
                    class="buttons is-right"
                    style="width: 100%;">
                    <button
                        class="button is-light"
                        @click="cancel()">
                        <span>
                            Cancel
                        </span>
                        <span class="icon">
                            <i class="fa fa-times-circle" />
                        </span>
                    </button>
                    <button
                        v-if="type==='export'"
                        class="button is-info"
                        @click="confirm">
                        <span>
                            Export file
                        </span>
                        <span class="icon">
                            <i class="fa fa-download" />
                        </span>
                    </button>
                    <button
                        v-else
                        class="button"
                        :class="modalConfirmButton"
                        @click="confirm">
                        <span>
                            Confirm
                        </span>
                        <span
                            class="icon"
                            :class="modalButtonIcons">
                            <i class="fa fa-check-circle" />
                        </span>
                    </button>
                </div>
            </footer>
        </div>
    </div>
</template>

<script>
import Modal from './../plugins/modalPlugin.js';

export default {
    name: 'CassModal',
    props: {
    },
    data() {
        return {
            selectedExportOption: {},
            visible: false,
            exportOptions: [],
            title: '',
            type: '',
            text: '',
            // adding callback function variable
            onConfirm: {},
            options: [],
            selectedOption: "",
            onCancel: {},
            newName: '',
            currentName: '',
            invalid: false,
            repo: window.repo
        };
    },
    computed: {
        modalButtonIcons: function() {
            let modalClass = '';
            if (this.type === 'removeObject') {
                modalClass = 'has-text-white';
            } else if (this.type === 'deleteObject') {
                modalClass = 'has-text-white';
            } else {
                modalClass = 'has-text-white';
            }
            return modalClass;
        },
        modalClass: function() {
            let modalClass = '';
            if (this.type === 'removeObject') {
                modalClass = 'alert-modal';
            } else if (this.type === 'deleteObject') {
                modalClass = 'warning-modal';
            } else {
                modalClass = 'info-modal';
            }
            return modalClass;
        },
        modalHeaderFontColor: function() {
            let modalClass = '';
            if (this.type === 'removeObject') {
                modalClass = 'has-text-warning';
            } else if (this.type === 'deleteObject') {
                modalClass = 'has-text-danger';
            } else {
                modalClass = 'has-text-dark';
            }
            return modalClass;
        },
        modalConfirmButton: function() {
            let modalClass = '';
            if (this.type === 'removeObject') {
                modalClass = 'is-warning has-text-white';
            } else if (this.type === 'deleteObject') {
                modalClass = 'is-danger has-text-white';
            } else {
                modalClass = 'is-info has-text-white';
            }
            return modalClass;
        },
        modalHeaderBackground: function() {
            let modalClass = '';
            if (this.type === 'removeObject') {
                modalClass = 'has-background-light';
            } else if (this.type === 'deleteObject') {
                modalClass = 'has-background-light';
            } else {
                modalClass = 'has-background-light';
            }
            return modalClass;
        }

    },
    methods: {
        hide() {
            this.visible = false;
            this.selectedOption = "";
            this.newName = '';
            this.currentName = '';
            this.invalid = false;
        },
        confirm() {
            var me = this;
            if (typeof this.onConfirm === 'function') {
                // perform call back and then handle hide
                if (this.type === 'export') {
                    this.onConfirm(this.selectedExportOption);
                    this.hide();
                } else if (this.newName) {
                    if (this.newName === this.currentName) {
                        this.invalid = true;
                    } else {
                        var uuid = new UUID(3, "nil", this.newName).format();
                        var f = new EcFramework();
                        f.assignId(this.repo.selectedServer, uuid);
                        this.repo.search("(@id:\"" + f.shortId() + "\") AND (@type:Framework)", function() {}, function(frameworks) {
                            if (frameworks.length > 0) {
                                me.invalid = true;
                            } else {
                                me.onConfirm(me.newName);
                                me.hide();
                            }
                        }, function(error) {
                            console.error(error);
                            me.hide();
                        });
                    }
                } else if (this.options && this.type !== "duplicate") {
                    this.onConfirm(this.selectedOption);
                    this.hide();
                } else {
                    this.onConfirm();
                    this.hide();
                }
            } else {
                this.hide();
            }
        },
        cancel() {
            if (typeof this.onCancel === 'function') {
                // perform call back and then handle hide
                this.onCancel();
                this.hide();
            } else {
                this.hide();
            }
        },
        show(params) {
            this.type = params.type;
            this.visible = true;
            this.selectedExportOption = params.selectedExportOption;
            this.title = params.title;
            this.text = params.text;
            this.exportOptions = params.exportOptions;
            this.options = params.options;
            // callback
            this.onConfirm = params.onConfirm;
            this.onCancel = params.onCancel;
            this.currentName = params.currentName;
        },
        setSelectedExportOption: function(e) {
            alert(e.target);
            this.selectedExportOption = e.target.value;
        }
    },
    beforeMount() {
    // listen for events declared in plugin
        Modal.EventBus.$on('show', (params) => {
            this.show(params);
        });
    }
};
</script>

<style lang="scss">
.warning-modal {

}
</style>