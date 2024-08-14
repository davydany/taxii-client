$(document).ready(function() {
    let connections = JSON.parse(localStorage.getItem('taxiiConnections')) || [];

    function saveConnections() {
        localStorage.setItem('taxiiConnections', JSON.stringify(connections));
    }

    function renderConnections() {
        const $list = $('#connection-list');
        $list.empty();
        connections.forEach((conn, index) => {
            $list.append(`<li class="list-group-item" data-index="${index}">${conn.name}</li>`);
        });
    }

    function showConnectionForm(connection = null) {
        const isEdit = connection !== null;
        const title = isEdit ? 'Edit Connection' : 'Add Connection';
        const html = `
            <h3>${title}</h3>
            <form id="connection-form">
                <div class="mb-3">
                    <label for="name" class="form-label">Name</label>
                    <input type="text" class="form-control" id="name" name="name" required value="${isEdit ? connection.name : ''}">
                </div>
                <div class="mb-3">
                    <label for="description" class="form-label">Description</label>
                    <input type="text" class="form-control" id="description" name="description" value="${isEdit ? connection.description : ''}">
                </div>
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" class="form-control" id="username" name="username" required value="${isEdit ? connection.username : ''}">
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" name="password" required value="${isEdit ? connection.password : ''}">
                </div>
                <div class="mb-3">
                    <label for="url" class="form-label">URL</label>
                    <input type="url" class="form-control" id="url" name="url" required value="${isEdit ? connection.url : ''}">
                </div>
                <div class="mb-3">
                    <label for="port" class="form-label">Port</label>
                    <input type="number" class="form-control" id="port" name="port" value="${isEdit ? connection.port : '443'}">
                </div>
                <div class="mb-3">
                    <label for="taxiiVersion" class="form-label">TAXII Version</label>
                    <select class="form-select" id="taxiiVersion" name="taxiiVersion">
                        <option value="2.1" ${isEdit && connection.taxiiVersion === '2.1' ? 'selected' : ''}>TAXII 2.1</option>
                        <option value="1.0" ${isEdit && connection.taxiiVersion === '1.0' ? 'selected' : ''}>TAXII 1.0</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'}</button>
                ${isEdit ? '<button type="button" class="btn btn-danger ms-2" id="delete-connection">Delete</button>' : ''}
            </form>
        `;
        $('#connections-column').append(html);

        $('#connection-form').on('submit', function(e) {
            e.preventDefault();
            const formData = $(this).serializeArray();
            const newConnection = {};
            formData.forEach(item => {
                newConnection[item.name] = item.value;
            });
            if (isEdit) {
                connections[connections.indexOf(connection)] = newConnection;
            } else {
                connections.push(newConnection);
            }
            saveConnections();
            renderConnections();
            $(this).parent().remove();
        });

        if (isEdit) {
            $('#delete-connection').on('click', function() {
                connections = connections.filter(c => c !== connection);
                saveConnections();
                renderConnections();
                $('#connection-form').parent().remove();
            });
        }
    }

    $('#add-connection').on('click', function() {
        showConnectionForm();
    });

    $('#connection-list').on('click', 'li', function() {
        const index = $(this).data('index');
        const connection = connections[index];
        showConnectionForm(connection);
        updateActionSelect(connection.taxiiVersion);
    });

    function updateActionSelect(taxiiVersion) {
        const $actionSelect = $('#action-select');
        $actionSelect.empty().prop('disabled', false);
        $actionSelect.append('<option value="">Select an action</option>');

        if (taxiiVersion === '2.1') {
            $actionSelect.append(`
                <option value="discovery">Discovery</option>
                <option value="collections">Collections</option>
                <option value="objects">Objects</option>
                <option value="inbox">Inbox</option>
            `);
        } else if (taxiiVersion === '1.0') {
            $actionSelect.append(`
                <option value="discovery">Discovery</option>
                <option value="inbox">Inbox</option>
                <option value="collection">Collection</option>
                <option value="poll-request">Poll Request</option>
                <option value="poll-fulfillment">Poll Fulfillment</option>
            `);
        }
    }

    $('#action-select').on('change', function() {
        const action = $(this).val();
        showActionParams(action);
    });

    function showActionParams(action) {
        const $params = $('#action-params');
        $params.empty();

        const commonParams = `
            <div class="mb-3">
                <label for="collection-id" class="form-label">Collection ID</label>
                <input type="text" class="form-control" id="collection-id" name="collection-id">
            </div>
        `;

        let additionalParams = '';

        switch (action) {
            case 'objects':
                additionalParams = `
                    <div class="mb-3">
                        <label for="added-after" class="form-label">Added After</label>
                        <input type="datetime-local" class="form-control" id="added-after" name="added-after">
                    </div>
                    <div class="mb-3">
                        <label for="match-id" class="form-label">Match ID</label>
                        <input type="text" class="form-control" id="match-id" name="match[id]">
                    </div>
                    <div class="mb-3">
                        <label for="match-type" class="form-label">Match Type</label>
                        <input type="text" class="form-control" id="match-type" name="match[type]">
                    </div>
                    <div class="mb-3">
                        <label for="match-version" class="form-label">Match Version</label>
                        <input type="text" class="form-control" id="match-version" name="match[version]">
                    </div>
                `;
                break;
            case 'poll-request':
                additionalParams = `
                    <div class="mb-3">
                        <label for="begin-timestamp" class="form-label">Begin Timestamp</label>
                        <input type="datetime-local" class="form-control" id="begin-timestamp" name="begin-timestamp">
                    </div>
                    <div class="mb-3">
                        <label for="end-timestamp" class="form-label">End Timestamp</label>
                        <input type="datetime-local" class="form-control" id="end-timestamp" name="end-timestamp">
                    </div>
                `;
                break;
        }

        $params.append(commonParams + additionalParams);
        $params.append('<button id="submit-action" class="btn btn-primary">Submit</button>');
    }

    $('#action-params').on('click', '#submit-action', function() {
        const action = $('#action-select').val();
        const params = {};
        $('#action-params input').each(function() {
            params[$(this).attr('name')] = $(this).val();
        });
        executeAction(action, params);
    });

    function executeAction(action, params) {
        // This is where you would implement the actual TAXII requests
        // For now, we'll just log the action and params
        console.log('Executing action:', action, 'with params:', params);
        $('#results-output').text(JSON.stringify({ action, params }, null, 2));
    }

    renderConnections();
});
