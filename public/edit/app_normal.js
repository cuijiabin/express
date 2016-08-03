var editor = null;
var formatter = null;

var app = {};

/**
 * 把格式化的json加载到编辑器中
 */
app.formatterToEditor = function () {
	try {
		editor.set(formatter.get());
	} catch (err) {
		app.notify.showError(err);
	}
};

/**
 * 把编辑器的json加载到格式化中
 */
app.editorToFormatter = function () {
	try {
		formatter.set(editor.get());
	} catch (err) {
		app.notify.showError(err);
	}
};

/**
 * 加载接口(editor, formatter, splitter)
 */
app.load = function (json) {
	try {
		app.notify = new Notify();
		app.lastChanged = undefined;

		// formatter
		var container = document.getElementById("json-output");
		formatter = new JSONFormatter(container, {
			change: function () {
				app.lastChanged = formatter;
			}
		});
		formatter.set(json);
		formatter.onError = function (err) {
			app.notify.showError(err);
		};

		// editor
		container = document.getElementById("json-input");
		editor = new JSONEditor(container, {
			change: function () {
				app.lastChanged = editor;
			}
		});
		editor.set(json);

		// splitter
		var domSplitter = document.getElementById('json-to');
		app.splitter = new Splitter({
			container: domSplitter,
			change: function () {
				app.resize();
			}
		});

        var toForm = document.createElement('button');
        toForm.id = 'toForm';
        toForm.title = '解析JSON';
        toForm.className = 'convert';
        toForm.innerHTML = '<div class="convert-left"></div>';
        toForm.onclick = function () {
            this.focus();
            app.formatterToEditor();
        };
        domSplitter.appendChild(toForm);

		var toJSON = document.createElement('button');
		toJSON.id = 'toJSON';
		toJSON.title = '保存JSON';
		toJSON.className = 'convert';
		toJSON.innerHTML = '<div class="convert-right"></div>';
		toJSON.onclick = function () {
			this.focus();
			app.editorToFormatter();
		};
		domSplitter.appendChild(toJSON);

		// web page resize handler
		JSONEditor.Events.addEventListener(window, 'resize', app.resize);

		// enforce FireFox to not do spell checking on any input field
		document.body.spellcheck = false;
	} catch (err) {
		app.notify.showError(err);
	}
};

/**
 * 回调函数 called when a file or url is opened.
 * @param {Error} err
 * @param {String} data
 */
app.openCallback = function (err, data) {
	if (!err) {
		if (data != undefined) {
			formatter.setText(data);
			try {
				var json = JSONEditor.parse(data);
				editor.set(json);
			} catch (err) {
				editor.set({});
				app.notify.showError(err);
			}
		}
	} else {
		app.notify.showError(err);
	}
};


/**
 * 改变窗口大小
 */
app.resize = function () {

};