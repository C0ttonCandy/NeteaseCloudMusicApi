<template>
  <div>
    <div class="top">
      <div class="top-op">
        <div class="btn">
          <el-upload
            :show-file-list="false"
            :with-credentials="true"
            :multiple="true"
            :http-request="addFile"
            :accept="fileAccept"
          >
            <el-button type="primary">
              <span class="iconfont icon-upload"></span>
              上传
            </el-button>
          </el-upload>
        </div>
        <el-button type="success" @click="newFolder" v-if="category == 'all'">
          <span class="iconfont icon-folder-add"></span>
          新建文件夹
        </el-button>
        <el-button
          @click="delFileBatch"
          type="danger"
          :disabled="selectFileIdList.length == 0"
        >
          <span class="iconfont icon-del"></span>
          批量删除
        </el-button>
        <el-button
          @click="moveFolderBatch"
          type="warning"
          :disabled="selectFileIdList.length == 0"
        >
          <span class="iconfont icon-move"></span>
          批量移动
        </el-button>
        <el-button
          @click="spider"
          type="info"
          class="edit"
          v-if="category == 'all'||category == 'spider'"
        >
          <span class="iconfont icon-spider"></span>
          进行爬取
        </el-button>
        <div class="search-panel">
          <el-input
            clearable
            placeholder="输入文件名搜索"
            v-model="fileNameFuzzy"
            @keyup.enter="search"
          >
            <template #suffix>
              <i class="iconfont icon-search" @click="search"></i>
            </template>
          </el-input>
        </div>
        <div class="iconfont icon-refresh" @click="loadDataList"></div>
      </div>
      <!--导航-->
      <Navigation ref="navigationRef" @navChange="navChange"></Navigation>
    </div>
    <div class="file-list" v-if="tableData.list && tableData.list.length > 0">
      <Table
        ref="dataTableRef"
        :columns="columns"
        :showPagination="true"
        :dataSource="tableData"
        :fetch="loadDataList"
        :initFetch="false"
        :options="tableOptions"
        @rowSelected="rowSelected"
      >
        <template #fileName="{ index, row }">
          <div
            class="file-item"
            @mouseenter="showOp(row)"
            @mouseleave="cancelShowOp(row)"
          >
            <template
              v-if="(row.fileType == 3 || row.fileType == 1) && row.status == 2"
            >
              <icon :cover="row.fileCover" :width="32"></icon>
            </template>
            <template v-else>
              <icon v-if="row.folderType == 0" :fileType="row.fileType"></icon>
              <icon v-if="row.folderType == 1" :fileType="0"></icon>
            </template>
            <span class="file-name" v-if="!row.showEdit" :title="row.fileName">
              <span @click="preview(row)">{{ row.fileName }}</span>
              <span v-if="row.status == 0" class="transfer-status">转码中</span>
              <span v-if="row.status == 1" class="transfer-status transfer-fail"
                >转码失败</span
              >
            </span>
            <div class="edit-panel" v-if="row.showEdit">
              <el-input
                v-model.trim="row.fileNameReal"
                ref="editNameRef"
                :maxLength="190"
                @keyup.enter="saveNameEdit(index)"
              >
                <template #suffix>{{ row.fileSuffix }}</template>
              </el-input>
              <span
                :class="[
                  'iconfont icon-right1',
                  row.fileNameReal ? '' : 'not-allow',
                ]"
                @click="saveNameEdit(index)"
              ></span>
              <span
                class="iconfont icon-error"
                @click="cancelNameEdit(index)"
              ></span>
            </div>
            <span class="op">
              <template v-if="row.showOp && row.fileId && row.status == 2">
                <span class="iconfont icon-share1" @click="share(row)"
                  >分享</span
                >
                <span
                  class="iconfont icon-download"
                  @click="download(row)"
                  v-if="row.folderType == 0"
                  >下载</span
                >
                <span class="iconfont icon-del" @click="delFile(row)"
                  >删除</span
                >
                <span
                  class="iconfont icon-edit"
                  @click.stop="editFileName(index)"
                  >重命名</span
                >
                <span class="iconfont icon-move" @click="moveFolder(row)"
                  >移动</span
                >
              </template>
            </span>
          </div>
        </template>
        <template #fileSize="{ index, row }">
          <span v-if="row.fileSize">
            {{ proxy.Utils.size2Str(row.fileSize) }}</span
          >
        </template>
      </Table>
    </div>
    <div class="no-data" v-else>
      <div class="no-data-inner">
        <Icon iconName="no_data" :width="120" fit="fill"></Icon>
        <div class="tips">当前目录为空，上传你的第一个文件吧</div>
        <div class="op-list">
          <el-upload
            :show-file-list="false"
            :with-credentials="true"
            :multiple="true"
            :http-request="addFile"
            :accept="fileAccept"
          >
            <div class="op-item">
              <Icon iconName="file" :width="60"></Icon>
              <div>上传文件</div>
            </div>
          </el-upload>
          <div class="op-item" v-if="category == 'all'" @click="newFolder">
            <Icon iconName="folder" :width="60"></Icon>
            <div>新建目录</div>
          </div>
        </div>
      </div>
    </div>
    <!--预览-->
    <Preview ref="previewRef"> </Preview>
    <!--移动-->
    <FolderSelect
      ref="folderSelectRef"
      @folderSelect="moveFolderDone"
    ></FolderSelect>
    <!--分享-->
    <FileShare ref="shareRef"></FileShare>
    <!--爬虫类别-->
    <Dialog
      :show="spiderDialogStart.show"
      :title="spiderDialogStart.title"
      :showCancel="false"
      :padding="30"
      :width="450"
      @close="spiderDialogClose"      
    >
      <el-form>
        <el-button 
          type="primary"
          @click="NeteaseMusicStart"
        >
          网易云音乐
        </el-button>
        <el-button 
          type="success"
          @click="BilibiliStart"
        >
          bilibili
        </el-button>
        <el-button 
          type="warning"
          @click="WallPaperStart"
        >
          壁纸图片
        </el-button>
        <el-button 
          type="danger"
          @click="NovalStart"
        >
          小说
        </el-button>
      </el-form>
    </Dialog>
    <!--网易云音乐弹框-->
    <Dialog 
      :show= "NeteaseMusicDialog.show"
      :title= "NeteaseMusicDialog.title"
      :buttons="NeteaseMusicDialog.buttons"
      :showCancel="false"
      :width="600"
      @close="NeteaseMusicDialog.show=false"
    >
      <el-form>
        <el-form-item>
          <el-button 
            type="primary"
            @click="NeteaseMusicWorkStart"
            @mouseover.native="option=0"
          >
            通过网页id获取对应内容(歌手、歌曲、用户、歌单)
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button 
            type="warning"
            @click="NeteaseMusicWorkStart"
            @mouseover.native="option=1"
          >
            搜索关键字以获取(歌手、歌曲、歌单)
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button 
            type="success"
            @click="NeteaseMusicWorkStart"
            @mouseover.native="option=2"
          >
            通过分享链接获取(歌曲、歌单)
          </el-button>
        </el-form-item>
      </el-form>
    </Dialog>
    <!--网易云三个功能弹框-->
    <Dialog
      :show="NeteaseMusicWorkDialog.show"
      :title="NeteaseMusicWorkDialog.title"
      :buttons="NeteaseMusicWorkDialog.buttons"
      :showCancel="false"
      @close="NeteaseMusicWorkDialog.show=false"
    >
      <el-form
        label-width="100px"
        @submit.prevent
      >
        <el-form-item
          label="id号"
          v-if="option==0"
        >
          <el-input
            size="large"
            placeholder="请输入网易云音乐id号"
            v-model="neteaseMusicIdRef"
          >
          </el-input>
        </el-form-item>
        <el-form-item
          label="关键词"
          v-if="option==1"
        >
          <el-input
            size="large"
            placeholder="请输入网易云音乐关键词"
            v-model="neteaseMusicIdRef"
          >
          </el-input>
        </el-form-item>
        <el-form-item
          label="分享链接"
          v-if="option==2"
        >
          <el-input
            size="large"
            placeholder="请输入网易云音乐分享链接"
            v-model="neteaseMusicIdRef"
          >
          </el-input>
        </el-form-item>
        <el-form-item
          label="爬取类型"
        >
          <el-input
            size="large"
            placeholder="请输入爬取类型(如歌曲、歌单等)"
            v-model="neteaseMusicTypeRef"
          >
          </el-input>
        </el-form-item>
        <el-form-item
          label="起始位置"
        >
          <el-input
            size="large"
            placeholder="请输入起始位置(搜索歌曲或用户可不填)"
            v-model="neteaseMusicOffsetRef"
          >
          </el-input>
        </el-form-item>
        <el-form-item
          label="爬取长度"
        >
          <el-input
            size="large"
            placeholder="请输入爬取长度(搜索歌曲或用户可不填)"
            v-model="neteaseMusicLimitRef"
          >
          </el-input>
        </el-form-item>
      </el-form>
    </Dialog>
    <!--bilibili弹框-->
    <Dialog 
      :show= "BilibiliDialog.show"
      :title= "BilibiliDialog.title"
      :buttons="BilibiliDialog.buttons"
      :showCancel="false"
      :width="600"
      @close="BilibiliDialog.show=false"
    >
      <el-form
        label-width="100px"
      >
        <el-form-item label="BV号">
          <el-input
            size="large"
            placeholder="请输入bilibili视频BV号"
            v-model="bilibiliRef"
          >
          </el-input>
        </el-form-item>
      </el-form>
    </Dialog>
    <!--壁纸弹框-->
    <Dialog 
      :show= "WallPaperDialog.show"
      :title= "WallPaperDialog.title"
      :buttons="WallPaperDialog.buttons"
      :showCancel="false"
      :width="600"
      @close="WallPaperDialog.show=false"
    >
      <el-form
        label-width="100px"
      >
        <el-form-item label="壁纸类别">
          <el-dropdown>
            <el-input
            size="large"
            placeholder="请输入下载壁纸张数"
            v-model="wallPaperNum.value"
          >
          </el-input>
            <el-button type="primary">
              请选择爬取的壁纸类别
            </el-button>
            <template #dropdown>
              <el-dropdown-menu slot="dropdown">
                <el-row>
                  <el-col :span="12">
                    <el-dropdown-item @click.native="wallPaperRef='美女'">
                      美女
                    </el-dropdown-item>
                  </el-col>
                  <el-col :span="12">
                    <el-dropdown-item @click.native="wallPaperRef='动漫'">
                      动漫
                    </el-dropdown-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-dropdown-item @click.native="wallPaperRef='风景'">
                      风景
                    </el-dropdown-item>
                  </el-col>
                  <el-col :span="12">
                    <el-dropdown-item @click.native="wallPaperRef='动物'">
                      动物
                    </el-dropdown-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-dropdown-item @click.native="wallPaperRef='建筑'">
                      建筑
                    </el-dropdown-item>
                  </el-col>
                  <el-col :span="12">
                    <el-dropdown-item @click.native="wallPaperRef='节日'">
                      节日
                    </el-dropdown-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-dropdown-item @click.native="wallPaperRef='游戏'">
                      游戏
                    </el-dropdown-item>
                  </el-col>
                  <el-col :span="12">
                    <el-dropdown-item @click.native="wallPaperRef='汽车'">
                      汽车
                    </el-dropdown-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-dropdown-item @click.native="wallPaperRef='影视'">
                      影视
                    </el-dropdown-item>
                  </el-col>
                  <el-col :span="12">
                    <el-dropdown-item @click.native="wallPaperRef='花卉'">
                      花卉
                    </el-dropdown-item>
                  </el-col>
                </el-row>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
        </el-form-item>
      </el-form>
    </Dialog>
    <!--小说弹框-->
    <Dialog 
      :show= "NovalDialog.show"
      :title= "NovalDialog.title"
      :buttons="NovalDialog.buttons"
      :showCancel="false"
      :width="600"
      @close="NovalDialog.show=false"
    >
      <el-form
        label-width="100px"
      >
        <el-form-item label="小说名称">
          <el-input
            size="large"
            placeholder="请输入要爬取的小说名称"
            v-model="novelRef"
          >
          </el-input>
        </el-form-item>
        <el-form-item label="起始章节">
          <el-input
            size="large"
            placeholder="请输入小说的起始章节"
            v-model="novelStartRef"
          >
          </el-input>
        </el-form-item>
        <el-form-item label="结束章节">
          <el-input
            size="large"
            placeholder="请输入小说的结束章节"
            v-model="novelEndRef"
          >
          </el-input>
        </el-form-item>
      </el-form>
    </Dialog>
    <!-- 爬取中
    <Dialog 
      :show="loadingDialog.show"
      :title="loadingDialog.title"
      :buttons="loadingDialog.buttons"
      :showCancel="false"
      :top="500"
      :width="600"
      @close="loadingDialog.show=false"
    >

      <div
        v-loading=loadingDialog.show
        element-loading-text="loading"
        style="margin-top: 20px"
      >
      </div>
    </Dialog> -->
    <!--爬取完成-->
    <Dialog
      :show="false"
      :title="爬取完成"
      :buttons="关闭"
      :showCancel="false"
      :show-close="false"
    >
      爬取完成
    </Dialog>
    <!--爬取失败-->
    <Dialog
      :show="false"
      :title="爬取失败"
      :buttons="关闭"
      :showCancel="false"
      :show-close="false"
    >
      爬取失败
    </Dialog>
    
  </div>
</template>

<script setup>
import CategoryInfo from "@/js/CategoryInfo.js";
import FileShare from "./ShareFile.vue";
import { ref, reactive, getCurrentInstance, nextTick, computed, normalizeClass } from "vue";
import { useRouter, useRoute } from "vue-router";
const { proxy } = getCurrentInstance();
const router = useRouter();
const route = useRoute();
const emit = defineEmits(["addFile"]);
//添加文件
const addFile = async (fileData) => {
  emit("addFile", { file: fileData.file, filePid: currentFolder.value.fileId });
};
//添加文件回调
const reload = () => {
  showLoading.value = false;
  loadDataList();
};
defineExpose({
  reload,
});

const currentFolder = ref({ fileId: 0 });

const api = {
  loadDataList: "/file/loadDataList",
  rename: "/file/rename",
  newFoloder: "/file/newFoloder",
  getFolderInfo: "/file/getFolderInfo",
  delFile: "/file/delFile",
  changeFileFolder: "/file/changeFileFolder",
  createDownloadUrl: "/file/createDownloadUrl",
  download: "/api/file/download",
  getBilibili: "/crawl/getBiliBili",
  getWallPaper: "/crawl/getWallPaper",
  getNovel: "/crawl/getNovel",
  getNeteaseMusicById: "/crawl/cloudMusic/byId",
  getNeteaseMusicBySearch: "/crawl/cloudMusic/bySearch",
  getNeteaseMusicByShare: "/crawl/cloudMusic/byShare",
};

const fileAccept = computed(() => {
  const categoryItem = CategoryInfo[category.value];
  return categoryItem ? categoryItem.accept : "*";
});

//列表
const columns = [
  {
    label: "文件名",
    prop: "fileName",
    scopedSlots: "fileName",
  },
  {
    label: "修改时间",
    prop: "lastUpdateTime",
    width: 200,
  },
  {
    label: "大小",
    prop: "fileSize",
    scopedSlots: "fileSize",
    width: 200,
  },
];
//搜索
const search = () => {
  showLoading.value = true;
  loadDataList();
};
//列表
const tableData = ref({});
const tableOptions = {
  extHeight: 50,
  selectType: "checkbox",
};

const fileNameFuzzy = ref();
const showLoading = ref(true);
const category = ref();

const loadDataList = async () => {
  let params = {
    pageNo: tableData.value.pageNo,
    pageSize: tableData.value.pageSize,
    fileNameFuzzy: fileNameFuzzy.value,
    category: category.value,
    filePid: currentFolder.value.fileId,
  };
  if (params.category !== "all") {
    delete params.filePid;
  }
  let result = await proxy.Request({
    url: api.loadDataList,
    showLoading: showLoading,
    params,
  });
  if (!result) {
    return;
  }
  tableData.value = result.data;
  editing.value = false;
};

//展示操作按钮
const showOp = (row) => {
  tableData.value.list.forEach((element) => {
    element.showOp = false;
  });
  row.showOp = true;
};

const cancelShowOp = (row) => {
  row.showOp = false;
};

//编辑行
const editing = ref(false);
const editNameRef = ref();
//新建文件夹
const newFolder = () => {
  if (editing.value) {
    return;
  }
  tableData.value.list.forEach((element) => {
    element.showEdit = false;
  });
  editing.value = true;
  tableData.value.list.unshift({
    showEdit: true,
    fileType: 0,
    fileId: "",
    filePid: currentFolder.value.fileId,
  });
  nextTick(() => {
    editNameRef.value.focus();
  });
};

const cancelNameEdit = (index) => {
  const fileData = tableData.value.list[index];
  if (fileData.fileId) {
    fileData.showEdit = false;
  } else {
    tableData.value.list.splice(index, 1);
  }
  editing.value = false;
};

const saveNameEdit = async (index) => {
  const { fileId, filePid, fileNameReal } = tableData.value.list[index];
  if (fileNameReal == "" || fileNameReal.indexOf("/") != -1) {
    proxy.Message.warning("文件名不能为空且不能含有斜杠");
    return;
  }
  let url = api.rename;
  if (fileId == "") {
    url = api.newFoloder;
  }
  let result = await proxy.Request({
    url: url,
    params: {
      fileId,
      filePid: filePid,
      fileName: fileNameReal,
    },
  });
  if (!result) {
    return;
  }
  tableData.value.list[index] = result.data;
  editing.value = false;
};

//编辑文件名
const editFileName = (index) => {
  if (tableData.value.list[0].fileId == "") {
    tableData.value.list.splice(0, 1);
    index = index - 1;
  }
  tableData.value.list.forEach((element) => {
    element.showEdit = false;
  });
  let cureentData = tableData.value.list[index];
  cureentData.showEdit = true;

  //编辑文件
  if (cureentData.folderType == 0) {
    cureentData.fileNameReal = cureentData.fileName.substring(
      0,
      cureentData.fileName.indexOf(".")
    );
    cureentData.fileSuffix = cureentData.fileName.substring(
      cureentData.fileName.indexOf(".")
    );
  } else {
    cureentData.fileNameReal = cureentData.fileName;
    cureentData.fileSuffix = "";
  }
  editing.value = true;
  nextTick(() => {
    editNameRef.value.focus();
  });
};

//多选 批量选择
const selectFileIdList = ref([]);
const rowSelected = (rows) => {
  selectFileIdList.value = [];
  rows.forEach((item) => {
    selectFileIdList.value.push(item.fileId);
  });
};

//删除文件
const delFile = (row) => {
  proxy.Confirm(
    `你确定要删除【${row.fileName}】吗？删除的文件可在10天内通过回收站还原`,
    async () => {
      let result = await proxy.Request({
        url: api.delFile,
        params: {
          fileIds: row.fileId,
        },
      });
      if (!result) {
        return;
      }
      loadDataList();
    }
  );
};
//批量删除
const delFileBatch = () => {
  if (selectFileIdList.value.length == 0) {
    return;
  }
  proxy.Confirm(
    `你确定要删除这些文件吗？删除的文件可在10天内通过回收站还原`,
    async () => {
      let result = await proxy.Request({
        url: api.delFile,
        params: {
          fileIds: selectFileIdList.value.join(","),
        },
      });
      if (!result) {
        return;
      }
      loadDataList();
    }
  );
};

//移动目录
const folderSelectRef = ref();
const currentMoveFile = ref({});
const moveFolder = (data) => {
  currentMoveFile.value = data;
  folderSelectRef.value.showFolderDialog(currentFolder.value.fileId);
};

//批量移动
const moveFolderBatch = () => {
  currentMoveFile.value = {};
  folderSelectRef.value.showFolderDialog(currentFolder.value.fileId);
};

const moveFolderDone = async (folderId) => {
  if (
    currentMoveFile.value.filePid === folderId ||
    currentFolder.value.fileId == folderId
  ) {
    proxy.Message.warning("文件正在当前目录，无需移动");
    return;
  }
  let filedIdsArray = [];
  if (currentMoveFile.value.fileId) {
    filedIdsArray.push(currentMoveFile.value.fileId);
  } else {
    filedIdsArray = filedIdsArray.concat(selectFileIdList.value);
  }
  let result = await proxy.Request({
    url: api.changeFileFolder,
    params: {
      fileIds: filedIdsArray.join(","),
      filePid: folderId,
    },
  });
  if (!result) {
    return;
  }
  folderSelectRef.value.close();
  loadDataList();
};

//爬虫
const spider = () => {
  spiderDialogStart.show=true;
}
const NeteaseMusicDialog = (reactive)({
  show: false,
  title: "爬虫设置",
  buttons: [
    {
      type:"info",
      text:"返回",
      click: () => {
        NeteaseMusicDialog.show=false;
        spiderDialogStart.show=true;
      },
    },
  ],
})
const NeteaseMusicWorkDialog = (reactive)({
  show: false,
  title: "设置搜索内容",
  buttons: [
    {
      type:"info",
      text:"返回",
      click: () => {
        NeteaseMusicWorkDialog.show=false;
        NeteaseMusicDialog.show=true;
      },
    },
    {
      type:"primary",
      text:"设置完成",
      click: () => {
        NeteaseMusicRequest();
        loadDataList();
      },
    },
  ],
})
const BilibiliDialog = (reactive)({
  show: false,
  title: "爬取b站视频",
  buttons: [
    {
      type:"info",
      text:"返回",
      click: () => {
        BilibiliDialog.show=false;
        spiderDialogStart.show=true;
      },
    },
    {
      type:"primary",
      text:"设置完成",
      click: () => {
        BilibiliRequest();
        loadDataList();
      },
    },
  ],
})
const WallPaperDialog = (reactive)({
  show: false,
  title: "爬取壁纸",
  buttons: [
    {
      type:"info",
      text:"返回",
      click: () => {
        WallPaperDialog.show=false;
        spiderDialogStart.show=true;
      },
    },
    {
      type:"primary",
      text:"设置完成",
      click: () => {
        WallPaperRequest();
        loadDataList();
      },
    },
  ],
})
const NovalDialog = (reactive)({
  show: false,
  title: "爬取小说",
  buttons: [
    {
      type:"info",
      text:"返回",
      click: () => {
        NovalDialog.show=false;
        spiderDialogStart.show=true;
      },
    },
    {
      type:"primary",
      text:"设置完成",
      click: () => {
        NovelRequest();
        loadDataList();
      },
    },
  ],
})
const spiderDialogClose = () => {
  spiderDialogStart.show=false;
}
const spiderDialogStart = (reactive)({
  show:false,
  title:"请选择爬虫类别",
})
const NeteaseMusicStart = () => {
  spiderDialogStart.show=false;
  NeteaseMusicDialog.show=true;
}
const NeteaseMusicWorkStart = () => {
  NeteaseMusicDialog.show=false;
  NeteaseMusicWorkDialog.show=true;
  if(option==0)
    _url=api.getNeteaseMusicById;
  else if(option==1)
    _url=api.getNeteaseMusicBySearch;
  else
    _url=api.getNeteaseMusicByShare;
}
const BilibiliStart = () => {
  spiderDialogStart.show=false;
  BilibiliDialog.show=true;
}
const WallPaperStart = () => {
  spiderDialogStart.show=false;
  WallPaperDialog.show=true;
}
const NovalStart = () => {
  spiderDialogStart.show=false;
  NovalDialog.show=true;
}
//爬虫前后端交互
const neteaseMusicIdRef = ref('');
const neteaseMusicTypeRef = ref('');
const neteaseMusicLimitRef = ref(0);
const neteaseMusicOffsetRef = ref(0);
const option = ref(0);
const _url = ref('');
const bilibiliRef = ref('');
const wallPaperRef = ref('');
const wallPaperNum = ref(1);
const novelRef = ref('');
const novelStartRef = ref(1);
const novelEndRef = ref(1);
const NeteaseMusicRequest = async () => {
  let params = {
    Id: neteaseMusicIdRef.value,
    type: neteaseMusicTypeRef.value,
    limit: neteaseMusicLimitRef.value,
    offset: neteaseMusicOffsetRef.value,
  };
  let result = await proxy.Request({
    url: _url,
    showLoading: showLoading,
    params,
  });
  if (!result) {
    return;
  }
}
const BilibiliRequest = async () => {
  let params = {
    BVId: bilibiliRef.value,
  };
  let result = await proxy.Request({
    url: api.getBilibili,
    showLoading: showLoading,
    params,
  });
  if (!result) {
    return;
  }
}
const WallPaperRequest = async () => {
  let params = {
    type: wallPaperRef.value,
    pageNum: wallPaperNum.value,
  };
  let result = await proxy.Request({
    url: api.getWallPaper,
    showLoading: showLoading,
    params,
  });
  if (!result) {
    return;
  }
}
const NovelRequest = async () => {
  let params = {
    novelId: novelRef.value,
    startPart: novelStartRef.value,
    finishPart: novelEndRef.value,
  };
  let result = await proxy.Request({
    url: api.getNovel,
    showLoading: showLoading,
    params,
  });
  if (!result) {
    return;
  }
}







const previewRef = ref();
const navigationRef = ref();
const preview = (data) => {
  if (data.folderType == 1) {
    //openFolder(data);
    navigationRef.value.openFolder(data);
    return;
  }
  if (data.status != 2) {
    proxy.Message.warning("文件正在转码中，无法预览");
    return;
  }
  previewRef.value.showPreview(data, 0);
};

//目录
const navChange = (data) => {
  const { curFolder, categoryId } = data;
  currentFolder.value = curFolder;
  showLoading.value = true;
  category.value = categoryId;
  loadDataList();
};

//下载文件
const download = async (row) => {
  let result = await proxy.Request({
    url: api.createDownloadUrl + "/" + row.fileId,
  });
  if (!result) {
    return;
  }
  window.location.href = api.download + "/" + result.data;
};

//分享
const shareRef = ref();
const share = (row) => {
  shareRef.value.show(row);
};

</script>

<style lang="scss" scoped>
@import "@/assets/file.list.scss";
.edit{
  background-color: rgb(21, 47, 72);
  border-color: rgb(21, 47, 72);
}
</style>