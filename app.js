$(document).ready(function() {
    let connections = JSON.parse(localStorage.getItem('taxiiConnections')) || [];

    function saveConnections() {
        localStorage.setItem('taxiiConnections', JSON.stringify(connections));
    }

    function renderConnections() {
        const $list = $('#connection-list');
        $list.empty();
        connections.forEach((conn, index) => {
            $list.append(`<li data-index="${index}">${conn.name}</li>`);
        });
    }

    function showConnectionForm(connection = null) {
        const isEdit = connection !== null;
        const title = isEdit ? 'Edit Connection' : 'Add Connection';
        const html = `
            <h3>${title}</h3>
            <form id="connection-form">
                <input type="text" name="name" placeholder="Name" required value="${isEdit ? connection.name : ''}">
                <input type="text" name="description" placeholder="Description" value="${isEdit ? connection.description : ''}">
                <input type="text" name="username" placeholder="Username" required value="${isEdit ? connection.username : ''}">
                <input type="password" name="password" placeholder="Password" required value="${isEdit ? connection.password : ''}">
                <input type="url" name="url" placeholder="URL" required value="${isEdit ? connection.url : ''}">
                <input type="number" name="port" placeholder="Port (default: 443)" value="${isEdit ? connection.port : '443'}">
                <select name="taxiiVersion">
                    <option value="2.1" ${isEdit && connection.taxiiVersion === '2.1' ? 'selected' : ''}>TAXII 2.1</option>
                    <option value="1.0" ${isEdit && connection.taxiiVersion === '1.0' ? 'selected' : ''}>TAXII 1.0</option>
                </select>
                <button type="submit">${isEdit ? 'Update' : 'Add'}</button>
                ${isEdit ? '<button type="button" id="delete-connection">Delete</button>' : ''}
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
            <input type="text" name="collection-id" placeholder="Collection ID">
        `;

        let additionalParams = '';

        switch (action) {
            case 'objects':
                additionalParams = `
                    <input type="datetime-local" name="added-after" placeholder="Added After">
                    <input type="text" name="match[id]" placeholder="Match ID">
                    <input type="text" name="match[type]" placeholder="Match Type">
                    <input type="text" name="match[version]" placeholder="Match Version">
                `;
                break;
            case 'poll-request':
                additionalParams = `
                    <input type="datetime-local" name="begin-timestamp" placeholder="Begin Timestamp">
                    <input type="datetime-local" name="end-timestamp" placeholder="End Timestamp">
                `;
                break;
        }

        $params.append(commonParams + additionalParams);
        $params.append('<button id="submit-action">Submit</button>');
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
