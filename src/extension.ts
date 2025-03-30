import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('coding-with-levi.startLevi', () => {
		const panel = vscode.window.createWebviewPanel(
			'leviAnimation',
			vscode.l10n.t("Levi Sergeant"), // 다국어 지원: 현지화 문자열 사용
			vscode.ViewColumn.Beside,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],  // 수정된 localResourceRoots 설정
				retainContextWhenHidden: true,  // 숨겨지더라도 상태 유지
			}
		);

		panel.webview.html = getWebviewContent(context, panel);  // panel을 getWebviewContent 함수에 전달

		// 코드 문서가 변경될 때마다 'attack' 메시지 전송
		const textChangeDisposable = vscode.workspace.onDidChangeTextDocument(() => {
			panel.webview.postMessage({ command: 'attack' });
		});
		context.subscriptions.push(textChangeDisposable);
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel) {
	// 참고: 웹뷰 sandbox 경고는 allow-scripts와 allow-same-origin을 동시에 사용할 때 발생합니다.
	// 만약 원격 콘텐츠를 로드하지 않고 직접 작성한 콘텐츠만 사용한다면 무시해도 됩니다.
	// 또한, media 파일은 확장 기능 루트의 'media' 폴더에 위치해야 합니다.
	// src 폴더 내부에 둘 필요는 없습니다.

	const images = ['levi1.png', 'levi2.png', 'levi3.png', 'levi4.png'];  // 이미지 목록
	// 문자열로 변환: .toString() 추가
	const imagesSrc = images.map(image => panelResourceUri(context, panel, image).toString());

	return `<!DOCTYPE html>
    <html lang="en">
    <body style="margin:0; overflow:hidden; background:transparent;">
        <img id="levi" style="width:100%; height:100%; display:none;" />
        
        <script>
            const vscode = acquireVsCodeApi();
            const images = ${JSON.stringify(imagesSrc)};
            console.log("Image URIs:", images);
            let currentIndex = 0;
            const imgElement = document.getElementById('levi');

            // 이미지 하나씩 표시하는 함수 수정 (이미지 숨김 제거)
            function updateImage() {
                imgElement.src = images[currentIndex];
                imgElement.style.display = 'block';
                currentIndex = (currentIndex + 1) % images.length;
            }
            
            window.addEventListener('message', event => {
                if (event.data.command === 'attack') {
                    updateImage();
                }
            });
        </script>
    </body>
    </html>`;
}

// Webview에서 사용할 이미지 경로를 변환하는 함수
function panelResourceUri(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, fileName: string) {
	const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', fileName);
	return panel.webview.asWebviewUri(onDiskPath);  // 이미지를 안전하게 웹뷰에서 사용할 수 있는 URI로 변환
}
