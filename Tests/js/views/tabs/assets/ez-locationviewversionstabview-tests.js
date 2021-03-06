/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ez-locationviewversionstabview-tests', function (Y) {
    var attributesTest,
        renderTest,
        changeEventTest,
        fireLoadVersionsEventTest,
        fireCreateDraftEventTest,
        selectArchivedVersionTest,
        Assert = Y.Assert,
        Mock = Y.Mock;

    attributesTest = new Y.Test.Case({
        name: "eZ LocationViewVersionsTabView attributes test",
        setUp: function () {
            this.view = new Y.eZ.LocationViewVersionsTabView({
                content: {},
                locations: {},
                config: {},
            });
        },

        tearDown: function () {
            this.view.destroy();
            delete this.view;
        },

        _readOnlyString: function (attr) {
            var value = this.view.get(attr);

            Assert.isString(
                this.view.get(attr),
                "The view should have a "+  attr
            );
            this.view.set(attr, value + 'somethingelse');
            Assert.areEqual(
                value, this.view.get(attr),
                "The " + attr + " should be readonly"
            );
        },

        "Should have a title": function () {
            this._readOnlyString('title');
        },

        "Should have a identifier": function () {
            this._readOnlyString('identifier');
        },

        "Should have a published versions object": function () {
            Assert.isObject(
                this.view.get('versions'),
                "versions should be an object"
            );
        },
    });

    renderTest = new Y.Test.Case({
        name: "eZ LocationViewVersionsTabView render test",
        setUp: function () {
            this.contentMock = new Mock();
            this.versions = {
                ARCHIVED: [],
                PUBLISHED: [],
                DRAFT: []
            };

            this.view = new Y.eZ.LocationViewVersionsTabView({
                content: this.contentMock,
                loadingError: false,
                config: {}
            });
        },

        tearDown: function () {
            this.view.destroy();
            delete this.view;
        },

        "Render should call the template": function () {
            var templateCalled = false,
                origTpl;

            origTpl = this.view.template;
            this.view.template = function () {
                templateCalled = true;
                return origTpl.apply(this, arguments);
            };
            this.view.render();
            Y.Assert.isTrue(templateCalled, "The template should have been used to render this.view");
        },

        _createVersionMock: function () {
            var versionMock = new Mock();

            Mock.expect(versionMock, {
                'method': 'toJSON',
                returns: {}
            });

            return versionMock;
        },

        _addArchivedVersionMock: function() {
            this.versions.ARCHIVED.push(this._createVersionMock());
        },

        _addDraftVersionMock: function() {
            this.versions.DRAFT.push(this._createVersionMock());
        },

        _testVariables: function (archivedSize, publishedSize, draftSize, hasArchived, hasPublished, hasDraft) {
            this.view.template = Y.bind(function (args) {
                Assert.areEqual(
                    archivedSize,
                    args.archivedVersions.length,
                    "archivedVersions should be available in the template"
                );
                Assert.areEqual(
                    publishedSize,
                    args.publishedVersions.length,
                    "expectedArchivedSize should be available in the template"
                );
                Assert.areEqual(
                    draftSize,
                    args.draftVersions.length,
                    "draftVersions should be available in the template"
                );
                Assert.areEqual(
                    hasArchived,
                    args.hasArchived,
                    "hasArchived should be available in the template"
                );
                Assert.areEqual(
                    hasPublished,
                    args.hasPublished,
                    "hasPublished should be available in the template"
                );
                Assert.areEqual(
                    hasDraft,
                    args.hasDraft,
                    "hasDraft should be available in the template"
                );
                Assert.isFalse(
                    args.loadingError,
                    "loadingError should be available in the template"
                );
            }, this);

            this.view.render();
        },

        "Variables should be available in the template all status": function () {
            this._addArchivedVersionMock();
            this._addDraftVersionMock();
            this._addDraftVersionMock();
            this._addDraftVersionMock();

            this.view.set('versions', this.versions);

            this._testVariables(1, 0, 3, true, false, true);
        },
    });

    changeEventTest = new Y.Test.Case({
        name: "eZ LocationViewVersionsTabView change event test",
        setUp: function () {
            this.view = new Y.eZ.LocationViewVersionsTabView();
        },

        tearDown: function () {
            this.view.destroy();
            delete this.view;
        },

        "Test that versions change event calls render": function () {
            var renderCalled = false;

            this.view.render = function () {
                renderCalled = true;
            };

            this.view.set('versions', "truc");

            Assert.isTrue(
                renderCalled,
                "Render should have been called when versions attribute changes"
            );

        },
    });

    fireLoadVersionsEventTest = new Y.Test.Case({
        name: "eZ LocationViewVersionsTabView fire load versions event test",
        setUp: function () {
            this.contentMock = new Mock();

            this.view = new Y.eZ.LocationViewVersionsTabView({
                content: this.contentMock,
                container: '.container'
            });
        },

        tearDown: function () {
            this.view.destroy();
            delete this.view;
        },

        "Should fire the loadVersions event": function () {
            var loadVersionsCalled = false;

            this.view.once('loadVersions', Y.bind(function (e) {
                loadVersionsCalled = true;
                Assert.areSame(
                    this.contentMock,
                    e.content,
                    "The event facade should contain the content"
                );
            }, this));

            this.view.set('active', true);

            Assert.isTrue(loadVersionsCalled, "loadVersions should have been called");
        },

        "Should try to reload the versions when tapping on the retry button": function () {
            var that = this,
                loadVersionsFired = false;

            this.view.render();
            this.view.set('active', true);
            this.view.set('loadingError', true);

            this.view.on('loadVersions', function () {
                loadVersionsFired = true;
            });

            this.view.get('container').one('.ez-asynchronousview-retry').simulateGesture('tap', function () {
                that.resume(function () {
                    Y.Assert.isNull(
                        that.view.get('versions'),
                        "The `versions` attribute should not be defined"
                    );
                    Y.Assert.isTrue(
                        loadVersionsFired,
                        "The loadLocations event should have been fired"
                    );
                });
            });
            this.wait();
        },
    });

    fireCreateDraftEventTest = new Y.Test.Case({
        name: "ViewVersionsTabView fire `createDraft` event test",
        setUp: function () {
            this.contentMock = new Mock();
            this.versions = {'ARCHIVED': []};

            this.view = new Y.eZ.LocationViewVersionsTabView({
                content: this.contentMock,
                container: '.container'
            });
        },

        tearDown: function () {
            this.view.destroy();
            delete this.view;
        },

        _createVersionMock: function (versionId, versionNo, checked) {
            var versionMock = new Mock();

            Mock.expect(versionMock, {
                'method': 'toJSON',
                returns: {
                    versionId: versionId,
                    checked: checked
                }
            });

            Mock.expect(versionMock, {
                method: 'get',
                args: [Mock.Value.String],
                run: Y.bind(function (attr) {
                    if ( attr === 'id' ) {
                        return versionId;
                    } else if ( attr === 'versionNo' ) {
                        return versionNo;
                    }
                    Y.fail('Unexpected call to get("' + attr + '")');
                }, this),
            });

            return versionMock;
        },

        _createArchivedVersionMock: function (nbOfChecked) {
            for (var i = 1; i <= nbOfChecked; i++) {
                this.versions.ARCHIVED.push(
                    this._createVersionMock("/version/" + i, i, true)
                );
            }

            //creating an item that is not checked
            this.versions.ARCHIVED.push(
                this._createVersionMock("/version/" + 42, 42, false)
            );
        },

        "Should fire the `createDraft` event": function () {
            var eventFired = false,
                createButton;

            this._createArchivedVersionMock(1);

            this.view.set('versions', this.versions);

            this.view.on('*:createDraft', Y.bind(function (e) {
                var checkbox = this.view.get('container').one('.ez-archived-version-checkbox[data-version-id="/version/1"]');

                eventFired = true;
                Assert.areSame(
                    this.contentMock,
                    e.content,
                    "The event facade should contain the content"
                );
                Assert.areSame(
                    1,
                    e.versionNo,
                    "The event facade should contain the versionNo"
                );
                Assert.isTrue(
                    checkbox.get('disabled'),
                    "The checkbox should be disabled"
                );
            }, this));

            this.view.render();

            createButton = this.view.get('container').one('.ez-create-draft-from-archived-button');
            createButton.set('disabled', false);

            createButton.simulateGesture('tap', Y.bind(function () {
                this.resume(function (e) {
                    Assert.isTrue(
                        eventFired,
                        "The `createDraft` event should have been fired"
                    );
                });
            }, this));
            this.wait();
        },

        "Should not fire the `createDraft` event if more than one version": function () {
            var eventFired = false,
                createButton;

            this._createArchivedVersionMock(2);

            this.view.set('versions', this.versions);

            this.view.on('*:createDraft', Y.bind(function (e) {
                eventFired = true;
            }, this));

            this.view.render();

            createButton = this.view.get('container').one('.ez-create-draft-from-archived-button');
            createButton.set('disabled', false);

            createButton.simulateGesture('tap', Y.bind(function () {
                this.resume(function (e) {
                    Assert.isFalse(
                        eventFired,
                        "The `createDraft` event should not have been fired"
                    );
                });
            }, this));
            this.wait();
        },
    });

    selectArchivedVersionTest = new Y.Test.Case({
        name: "ViewVersionsTabView select an archived version test",
        setUp: function () {
            this.contentMock = new Mock();
            this.versions = {'ARCHIVED': []};

            this.view = new Y.eZ.LocationViewVersionsTabView({
                content: this.contentMock,
                container: '.container'
            });
        },

        tearDown: function () {
            this.view.destroy();
            delete this.view;
        },

        _createVersionMock: function (versionId, versionNo, checked) {
            var versionMock = new Mock();

            Mock.expect(versionMock, {
                'method': 'toJSON',
                returns: {
                    versionId: versionId,
                    checked: checked
                }
            });

            Mock.expect(versionMock, {
                method: 'get',
                args: [Mock.Value.String],
                run: Y.bind(function (attr) {
                    if ( attr === 'id' ) {
                        return versionId;
                    } else if ( attr === 'versionNo' ) {
                        return versionNo;
                    }
                    Y.fail('Unexpected call to get("' + attr + '")');
                }, this),
            });

            return versionMock;
        },

        _createArchivedVersionMock: function (nb) {
            for (var i = 1; i <= nb; i++) {
                this.versions.ARCHIVED.push(
                    this._createVersionMock("/version/" + i, i, false)
                );
            }
        },

        "Should enable the create button when only an item is selected": function () {
            var createButton,
                version1,
                version2;

            this._createArchivedVersionMock(4);

            this.view.set('versions', this.versions);
            this.view.render();

            createButton = this.view.get('container').one('.ez-create-draft-from-archived-button');
            version1 = this.view.get('container').one(".ez-archived-version-checkbox[data-version-id='/version/1']");
            version2 = this.view.get('container').one(".ez-archived-version-checkbox[data-version-id='/version/2']");

            Assert.isTrue(
                createButton.get('disabled'),
                "Create Button should be disabled when no items are checked"
            );

            version1.setAttribute('checked', 'checked');
            version1.simulate('change');

            Assert.isFalse(
                createButton.get('disabled'),
                "Create Button should not be disabled"
            );

            version2.setAttribute('checked', 'checked');
            version2.simulate('change');

            Assert.isTrue(
                createButton.get('disabled'),
                "Create Button should be disabled when more than on item is checked"
            );

            version1.removeAttribute('checked');
            version1.simulate('change');

            Assert.isFalse(
                createButton.get('disabled'),
                "Create Button should not be disabled"
            );

            version2.removeAttribute('checked');
            version2.simulate('change');

            Assert.isTrue(
                createButton.get('disabled'),
                "Create Button should be disabled when no items are checked"
            );
        },
    });

    Y.Test.Runner.setName("eZ Location View Versions Tab View tests");
    Y.Test.Runner.add(attributesTest);
    Y.Test.Runner.add(renderTest);
    Y.Test.Runner.add(changeEventTest);
    Y.Test.Runner.add(fireLoadVersionsEventTest);
    Y.Test.Runner.add(fireCreateDraftEventTest);
    Y.Test.Runner.add(selectArchivedVersionTest);
}, '', {requires: ['test', 'ez-locationviewversionstabview', 'node-event-simulate']});
