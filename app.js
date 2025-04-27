const draggable = vuedraggable;

const app = Vue.createApp({
  data() {
    return {
      root: {
        position: '',
        title: '主',
        completed: false,
        children: []
      },
      breadcrumb: [],
      currentObjects: [],
      currentTitle: '',
      currentPath: [],
      newObjectTitle: '',
      showConfirmModal: false,    // <== 新增
      targetObject: null,          // <== 新增
      isProcessingConfirm: false,   // <== 新增
      showToast: false,  // <== 新增，控制是否顯示提示
      toastMessage: '',  // <== 新增，提示訊息內容
    };
  },
  mounted() {
    this.breadcrumb = [this.root];
    this.currentObjects = this.root.children;
    this.currentTitle = this.root.title;
    this.$nextTick(() => {
      this.focusInput();
    });
    this.loadDataFromServer();
  },
  methods: {
    addObject() {
      const parent = this.breadcrumb[this.breadcrumb.length - 1];
      if (parent.completed) {
        alert('此項目已完成，無法新增子項目！');
        this.newObjectTitle = '';
        return;
      }
      if (!this.newObjectTitle.trim()) return;

      const positionPrefix = this.generatePosition(parent);
      const newObj = {
        position: positionPrefix,
        title: this.newObjectTitle.trim(),
        children: [],
        completed: false  // <== 新增
      };

      parent.children.push(newObj);
      this.newObjectTitle = '';
      this.refreshCurrentObjects();
      this.$nextTick(() => {
        this.focusInput();
      });
    },
    enterObject(obj) {
      this.breadcrumb.push(obj);
      this.refreshCurrentObjects();
      this.$nextTick(() => {
        this.focusInput();
      });
    },
    backTo(index) {
      this.breadcrumb = this.breadcrumb.slice(0, index + 1);
      this.refreshCurrentObjects();
      this.$nextTick(() => {
        this.focusInput();
      });
    },
    refreshCurrentObjects() {
      const current = this.breadcrumb[this.breadcrumb.length - 1];
      this.currentObjects = current.children;
      this.currentTitle = current.title;
    },
    generatePosition(parent) {
      let parentPosition = parent.position;
      let nextIndex = parent.children.length + 1;
      if (parentPosition === '') {
        return `${nextIndex}`;
      } else {
        return `${parentPosition}-${nextIndex}`;
      }
    },
    focusInput() {
      const input = document.getElementById('object-input');
      if (input) {
        input.focus();
      }
    },
    handleInputKeydown(event) {
      if (event.key === 'Enter') {
        this.addObject();
      }
    },
    confirmComplete(obj) {
        this.targetObject = obj;
        this.showConfirmModal = true;
      },
      executeComplete() {
        if (this.targetObject) {
          // 按確定後，先切到"正在處理中"
          this.isProcessingConfirm = true;
      
          setTimeout(() => {
            this.markCompletedRecursively(this.targetObject);
      
            // 小動畫效果
            this.targetObject.justCompleted = true;
            setTimeout(() => {
              if (this.targetObject) this.targetObject.justCompleted = false;
            }, 500);
      
            // 全部處理完
            this.targetObject = null;
            this.showConfirmModal = false;
            this.isProcessingConfirm = false;
          }, 1000);
      
        } else {
          this.showConfirmModal = false;
          this.isProcessingConfirm = false;
        }
      },
      cancelComplete() {
        this.targetObject = null;
        this.showConfirmModal = false;
      },
      markCompletedRecursively(node) {
        node.completed = true;
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => {
            this.markCompletedRecursively(child);
          });
        }
    },
    animatedBackTo(index) {
        const buttons = document.querySelectorAll(".breadcrumb-dot");
        const targetButton = buttons[index];
        if (targetButton) {
          targetButton.classList.add("animate-pop");
      
          // 移除動畫class以便下次能再次觸發
          setTimeout(() => {
            targetButton.classList.remove("animate-pop");
          }, 300);
        }
        
        this.backTo(index);
      },
      deleteObject(obj) {
        if (obj.completed) {
          this.showToastMessage("⚠️ 已完成的項目無法刪除！");
          return;
        }
      
        const parent = this.breadcrumb[this.breadcrumb.length - 1];
        const index = parent.children.indexOf(obj);
        if (index !== -1) {
          parent.children.splice(index, 1);
          this.reindexPositions(parent);
          this.refreshCurrentObjects();
          this.showToastMessage("🗑️ 刪除成功！");
        }
      },
      reindexPositions(node) {
        node.children.forEach((child, index) => {
          // 更新這一層的 position
          const newPosition = node.position ? `${node.position}-${index + 1}` : `${index + 1}`;
          child.position = newPosition;
      
          // 如果這個child還有自己的子孫節點，也要遞迴下去
          if (child.children && child.children.length > 0) {
            this.reindexPositions(child);
          }
        });
      },
      showToastMessage(message) {
        this.toastMessage = message;
        this.showToast = true;
        
        // 1.5秒後自動隱藏
        setTimeout(() => {
          this.showToast = false;
        }, 1500);
      },
    //   handleEnterObject(obj) {
    //     this.enterObject(obj);
    //   },
    handleEnterObject(obj) {
        if (obj.completed && (!obj.children || obj.children.length === 0)) {
          this.showToastMessage("⚠️ 此節點已完成且無子項目！");
          return;
        }
        this.enterObject(obj);
      },
      loadDataFromServer() {
        axios.get('http://127.0.0.1:5000/load_json')
          .then(response => {
            if (response.data.status === 'success') {
              this.root = response.data.data;
              this.breadcrumb = [this.root];
              this.refreshCurrentObjects();
              this.showToastMessage('📂 資料已成功載入！');
            } else {
              this.showToastMessage('❌ 載入失敗！');
            }
          })
          .catch(error => {
            console.error('錯誤：', error);
            this.showToastMessage('❌ 載入時發生錯誤！');
          });
      },
      saveDataToServer() {
        axios.post('http://127.0.0.1:5000/save_json', this.root, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => {
          if (response.data.status === 'success') {
            this.showToastMessage('💾 資料已成功儲存到伺服器！');
          } else {
            this.showToastMessage('❌ 儲存失敗！');
          }
        })
        .catch(error => {
          console.error('錯誤：', error);
          this.showToastMessage('❌ 儲存時發生錯誤！');
        });
      }
      
  }
});

app.component('draggable', draggable);
app.mount('#app');
