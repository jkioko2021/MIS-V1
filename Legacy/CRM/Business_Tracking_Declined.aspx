<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Tracking_Declined.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1170px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="REFUND REQUEST" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td style="width: 1025px" align="right">
                                                    <asp:Label ID="Label141" runat="server" Text="Search by"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    <telerik:RadComboBox ID="cbosearch" Runat="server" AllowCustomText="True" 
                                                        AutoPostBack="True" MarkFirstMatch="True" Skin="Sunset" Width="190px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Text="Proposer Name" Value="P" />
                                                            <telerik:RadComboBoxItem runat="server" Text="File No." Value="F" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                                <td style="width: 264px">
                                                    <telerik:RadTextBox ID="txtsearch" Runat="server" Skin="Sunset" Width="250px">
                                                    </telerik:RadTextBox>
                                                </td>
                                                <td>
                                                    <telerik:RadButton ID="btnsearch" runat="server" Text="Search" Skin="Simple">
                                                    </telerik:RadButton>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <telerik:RadTabStrip ID="RadTabStrip1" runat="server">
                                                        <Tabs>
                                                            <telerik:RadTab runat="server" PageViewID="V1" Text="Termination">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" PageViewID="V2" Text="Overpayment">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" PageViewID="V3" Text="Declined">
                                                            </telerik:RadTab>
                                                        </Tabs>
                                                    </telerik:RadTabStrip>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="100%">
                                                        <telerik:RadPageView ID="V1" runat="server">
                                                            <asp:Panel ID="Panel37" runat="server">
                                                                <table style="width: 100%">
                                                                    <tr>
                                                                        <td bgcolor="#999999">
                                                                            <asp:Label ID="Label155" runat="server" Text="Details"></asp:Label>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            &nbsp;</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <asp:Panel ID="Panel38" runat="server" Height="100%" ScrollBars="Both" 
                                                                                Width="1128px">
                                                                                <telerik:RadGrid ID="GDTracking1" runat="server" AllowPaging="True" 
                                                                                    CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Sunset" 
                                                                                    Width="100%">
                                                                                    <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                        <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                            <HeaderStyle Width="20px" />
                                                                                        </RowIndicatorColumn>
                                                                                        <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                            <HeaderStyle Width="20px" />
                                                                                        </ExpandCollapseColumn>
                                                                                        <Columns>
                                                                                            <telerik:GridButtonColumn CommandName="Select" 
                                                                                                FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                                                UniqueName="Select">
                                                                                                <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                                                <ItemStyle Width="50px" />
                                                                                            </telerik:GridButtonColumn>
                                                                                            <telerik:GridBoundColumn DataField="Receive_dt" 
                                                                                                FilterControlAltText="Filter Receive_dt column" HeaderText="Receive_dt" 
                                                                                                SortExpression="Receive_dt" UniqueName="Receive_dt">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="File_No" 
                                                                                                FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                                SortExpression="File_No" UniqueName="File_No">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                                                FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                                                SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Client_Type" 
                                                                                                FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                                                SortExpression="Client_Type" UniqueName="Client_Type">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Business_Type" 
                                                                                                FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                                                SortExpression="Business_Type" UniqueName="Business_Type">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="File_Status" 
                                                                                                FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                                                SortExpression="File_Status" UniqueName="File_Status">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                                                ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                                                Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                                                <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                                                <ItemStyle CssClass="ButtonColumn" />
                                                                                            </telerik:GridButtonColumn>
                                                                                        </Columns>
                                                                                        <EditFormSettings>
                                                                                            <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                            </EditColumn>
                                                                                        </EditFormSettings>
                                                                                    </MasterTableView>
                                                                                    <ItemStyle Wrap="False" />
                                                                                    <FilterMenu EnableImageSprites="False">
                                                                                    </FilterMenu>
                                                                                    <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                    </HeaderContextMenu>
                                                                                </telerik:RadGrid>
                                                                            </asp:Panel>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <asp:Panel ID="Panel39" runat="server">
                                                                                <table style="width: 99%">
                                                                                    <tr>
                                                                                        <td colspan="4">
                                                                                            <asp:Label ID="Label156" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td colspan="4">
                                                                                            <asp:Panel ID="Panel40" runat="server" Height="100%" ScrollBars="Both" 
                                                                                                Width="1100px">
                                                                                                <telerik:RadGrid ID="GD_DOCS1" runat="server" AllowPaging="True" 
                                                                                                    CellSpacing="0" GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                                                                    <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                                        <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                                            <HeaderStyle Width="20px" />
                                                                                                        </RowIndicatorColumn>
                                                                                                        <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                                            <HeaderStyle Width="20px" />
                                                                                                        </ExpandCollapseColumn>
                                                                                                        <Columns>
                                                                                                            <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                                                                FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                                                                SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                                                            </telerik:GridBoundColumn>
                                                                                                            <telerik:GridBoundColumn DataField="File_No" 
                                                                                                                FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                                                                SortExpression="File_No" UniqueName="File_No">
                                                                                                            </telerik:GridBoundColumn>
                                                                                                            <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                                                                FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                                                                SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                                                            </telerik:GridBoundColumn>
                                                                                                            <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                                                                FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                                                                SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                                                            </telerik:GridBoundColumn>
                                                                                                            <telerik:GridBoundColumn DataField="File_Name" 
                                                                                                                FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                                                                SortExpression="File_Name" UniqueName="File_Name">
                                                                                                            </telerik:GridBoundColumn>
                                                                                                            <telerik:GridBoundColumn DataField="Upload_By" 
                                                                                                                FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                                                                SortExpression="Upload_By" UniqueName="Upload_By">
                                                                                                            </telerik:GridBoundColumn>
                                                                                                            <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                                                                ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                                                                Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                                                                <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                                                                <ItemStyle CssClass="ButtonColumn" />
                                                                                                            </telerik:GridButtonColumn>
                                                                                                        </Columns>
                                                                                                        <EditFormSettings>
                                                                                                            <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                                            </EditColumn>
                                                                                                        </EditFormSettings>
                                                                                                    </MasterTableView>
                                                                                                    <FilterMenu EnableImageSprites="False">
                                                                                                    </FilterMenu>
                                                                                                    <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                                    </HeaderContextMenu>
                                                                                                </telerik:RadGrid>
                                                                                            </asp:Panel>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 139px">
                                                                                            <asp:Label ID="Label157" runat="server" Text="Document"></asp:Label>
                                                                                        </td>
                                                                                        <td style="height: 35px">
                                                                                            <telerik:RadComboBox ID="cbodoc1" Runat="server" MarkFirstMatch="True" 
                                                                                                Skin="Sunset" Width="250px">
                                                                                            </telerik:RadComboBox>
                                                                                        </td>
                                                                                        <td style="width: 155px; height: 35px;">
                                                                                            <asp:Label ID="DOC_ID1" runat="server" 
                                                                                                style="font-weight: 700; color: #CC0000; background-color: #FFFFFF" 
                                                                                                Visible="False"></asp:Label>
                                                                                        </td>
                                                                                        <td style="height: 35px">
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 139px">
                                                                                            <asp:Label ID="Label158" runat="server" Text="Document"></asp:Label>
                                                                                        </td>
                                                                                        <td style="height: 35px">
                                                                                            <asp:FileUpload ID="FL3" runat="server" Width="330px" />
                                                                                        </td>
                                                                                        <td style="width: 155px; height: 35px;">
                                                                                            <asp:Label ID="Label159" runat="server" Text="Upload Date"></asp:Label>
                                                                                        </td>
                                                                                        <td style="height: 35px">
                                                                                            <telerik:RadDatePicker ID="dtupload1" Runat="server" Enabled="False" MinDate="" 
                                                                                                Skin="Sunset">
                                                                                                <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                                                    UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                                                </Calendar>
                                                                                                <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                                                </DateInput>
                                                                                                <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                                            </telerik:RadDatePicker>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 139px; height: 35px;">
                                                                                            <asp:Label ID="Label160" runat="server" Text="Notes"></asp:Label>
                                                                                        </td>
                                                                                        <td style="height: 35px">
                                                                                            <telerik:RadTextBox ID="txtcomment1" Runat="server" Font-Size="Medium" 
                                                                                                Height="50px" Skin="Sunset" TextMode="MultiLine" Width="450px">
                                                                                            </telerik:RadTextBox>
                                                                                        </td>
                                                                                        <td style="width: 155px; height: 35px;">
                                                                                            &nbsp;</td>
                                                                                        <td style="height: 35px">
                                                                                            &nbsp;</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 139px; height: 35px;">
                                                                                            &nbsp;</td>
                                                                                        <td style="height: 35px">
                                                                                            <telerik:RadButton ID="btnupload1" runat="server" Skin="Simple" Text="Upload" 
                                                                                                Width="148px">
                                                                                            </telerik:RadButton>
                                                                                            &nbsp;
                                                                                        </td>
                                                                                        <td style="width: 155px; height: 35px;">
                                                                                            <asp:HiddenField ID="HiddenField3" runat="server" />
                                                                                        </td>
                                                                                        <td style="height: 35px">
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td colspan="4" style="height: 35px;">
                                                                                            <asp:Label ID="lblupload1" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                                                                ForeColor="Red"></asp:Label>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td colspan="4" style="height: 35px;">
                                                                                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                                                            <telerik:RadButton ID="btnsubmit1" runat="server" Skin="Simple" Text="Forward" 
                                                                                                Width="204px">
                                                                                            </telerik:RadButton>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td colspan="4">
                                                                                            <asp:Panel ID="Panel41" runat="server" Height="100%" ScrollBars="Both" 
                                                                                                Width="100%">
                                                                                                <telerik:RadGrid ID="GDNOTES1" runat="server" AllowPaging="True" 
                                                                                                    CellSpacing="0" GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                                                                    <MasterTableView AutoGenerateColumns="False">
                                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                                        <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                                        </RowIndicatorColumn>
                                                                                                        <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                                        </ExpandCollapseColumn>
                                                                                                        <Columns>
                                                                                                            <telerik:GridBoundColumn DataField="Note_date" 
                                                                                                                FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                                                                                ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                                                                                <ItemStyle Width="100px" />
                                                                                                            </telerik:GridBoundColumn>
                                                                                                            <telerik:GridBoundColumn DataField="File_No" 
                                                                                                                FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                                                                ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                                                                                <ItemStyle Width="50px" />
                                                                                                            </telerik:GridBoundColumn>
                                                                                                            <telerik:GridBoundColumn DataField="Note_From" 
                                                                                                                FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                                                                                ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                                                                                <ItemStyle Width="100px" />
                                                                                                            </telerik:GridBoundColumn>
                                                                                                            <telerik:GridBoundColumn DataField="Notes" 
                                                                                                                FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                                                                                SortExpression="Notes" UniqueName="Notes">
                                                                                                            </telerik:GridBoundColumn>
                                                                                                        </Columns>
                                                                                                        <EditFormSettings>
                                                                                                            <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                                            </EditColumn>
                                                                                                        </EditFormSettings>
                                                                                                    </MasterTableView>
                                                                                                    <ItemStyle Wrap="False" />
                                                                                                    <FilterMenu EnableImageSprites="False">
                                                                                                    </FilterMenu>
                                                                                                    <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                                    </HeaderContextMenu>
                                                                                                </telerik:RadGrid>
                                                                                            </asp:Panel>
                                                                                        </td>
                                                                                    </tr>
                                                                                </table>
                                                                            </asp:Panel>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V2" runat="server">
                                                             <asp:Panel ID="Panel32" runat="server">
                                                                 <table style="width: 100%">
                                                                     <tr>
                                                                         <td bgcolor="#999999">
                                                                             <asp:Label ID="Label149" runat="server" Text="Details"></asp:Label>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             &nbsp;</td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             <asp:Panel ID="Panel33" runat="server" Height="100%" ScrollBars="Both" 
                                                                                 Width="1128px">
                                                                                 <telerik:RadGrid ID="GDTracking0" runat="server" AllowPaging="True" 
                                                                                     CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Sunset" 
                                                                                     Width="100%">
                                                                                     <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                         <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                             <HeaderStyle Width="20px" />
                                                                                         </RowIndicatorColumn>
                                                                                         <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                             <HeaderStyle Width="20px" />
                                                                                         </ExpandCollapseColumn>
                                                                                         <Columns>
                                                                                             <telerik:GridButtonColumn CommandName="Select" 
                                                                                                 FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                                                 UniqueName="Select">
                                                                                                 <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                                                 <ItemStyle Width="50px" />
                                                                                             </telerik:GridButtonColumn>
                                                                                             <telerik:GridBoundColumn DataField="Receive_dt" 
                                                                                                 FilterControlAltText="Filter Receive_dt column" HeaderText="Receive_dt" 
                                                                                                 SortExpression="Receive_dt" UniqueName="Receive_dt">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="File_No" 
                                                                                                 FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                                 SortExpression="File_No" UniqueName="File_No">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                                                 FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                                                 SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Client_Type" 
                                                                                                 FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                                                 SortExpression="Client_Type" UniqueName="Client_Type">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Business_Type" 
                                                                                                 FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                                                 SortExpression="Business_Type" UniqueName="Business_Type">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="File_Status" 
                                                                                                 FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                                                 SortExpression="File_Status" UniqueName="File_Status">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                                                 ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                                                 Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                                                 <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                                                 <ItemStyle CssClass="ButtonColumn" />
                                                                                             </telerik:GridButtonColumn>
                                                                                         </Columns>
                                                                                         <EditFormSettings>
                                                                                             <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                             </EditColumn>
                                                                                         </EditFormSettings>
                                                                                     </MasterTableView>
                                                                                     <ItemStyle Wrap="False" />
                                                                                     <FilterMenu EnableImageSprites="False">
                                                                                     </FilterMenu>
                                                                                     <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                     </HeaderContextMenu>
                                                                                 </telerik:RadGrid>
                                                                             </asp:Panel>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             <asp:Panel ID="Panel34" runat="server">
                                                                                 <table style="width: 99%">
                                                                                     <tr>
                                                                                         <td colspan="4">
                                                                                             <asp:Label ID="Label150" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td colspan="4">
                                                                                             <asp:Panel ID="Panel35" runat="server" Height="100%" ScrollBars="Both" 
                                                                                                 Width="1100px">
                                                                                                 <telerik:RadGrid ID="GD_DOCS0" runat="server" AllowPaging="True" 
                                                                                                     CellSpacing="0" GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                                                                     <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                                         <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                                             <HeaderStyle Width="20px" />
                                                                                                         </RowIndicatorColumn>
                                                                                                         <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                                             <HeaderStyle Width="20px" />
                                                                                                         </ExpandCollapseColumn>
                                                                                                         <Columns>
                                                                                                             <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                                                                 FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                                                                 SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="File_No" 
                                                                                                                 FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                                                                 SortExpression="File_No" UniqueName="File_No">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                                                                 FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                                                                 SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                                                                 FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                                                                 SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="File_Name" 
                                                                                                                 FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                                                                 SortExpression="File_Name" UniqueName="File_Name">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="Upload_By" 
                                                                                                                 FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                                                                 SortExpression="Upload_By" UniqueName="Upload_By">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                                                                 ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                                                                 Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                                                                 <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                                                                 <ItemStyle CssClass="ButtonColumn" />
                                                                                                             </telerik:GridButtonColumn>
                                                                                                         </Columns>
                                                                                                         <EditFormSettings>
                                                                                                             <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                                             </EditColumn>
                                                                                                         </EditFormSettings>
                                                                                                     </MasterTableView>
                                                                                                     <FilterMenu EnableImageSprites="False">
                                                                                                     </FilterMenu>
                                                                                                     <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                                     </HeaderContextMenu>
                                                                                                 </telerik:RadGrid>
                                                                                             </asp:Panel>
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td style="width: 139px">
                                                                                             <asp:Label ID="Label151" runat="server" Text="Document"></asp:Label>
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                             <telerik:RadComboBox ID="cbodoc0" Runat="server" MarkFirstMatch="True" 
                                                                                                 Skin="Sunset" Width="250px">
                                                                                             </telerik:RadComboBox>
                                                                                         </td>
                                                                                         <td style="width: 155px; height: 35px;">
                                                                                             <asp:Label ID="DOC_ID0" runat="server" 
                                                                                                 style="font-weight: 700; color: #CC0000; background-color: #FFFFFF" 
                                                                                                 Visible="False"></asp:Label>
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                             &nbsp;</td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td style="width: 139px">
                                                                                             <asp:Label ID="Label152" runat="server" Text="Document"></asp:Label>
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                             <asp:FileUpload ID="FL2" runat="server" Width="330px" />
                                                                                         </td>
                                                                                         <td style="width: 155px; height: 35px;">
                                                                                             <asp:Label ID="Label153" runat="server" Text="Upload Date"></asp:Label>
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                             <telerik:RadDatePicker ID="dtupload0" Runat="server" Enabled="False" MinDate="" 
                                                                                                 Skin="Sunset">
                                                                                                 <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                                                     UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                                                 </Calendar>
                                                                                                 <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                                                 </DateInput>
                                                                                                 <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                                             </telerik:RadDatePicker>
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td style="width: 139px; height: 35px;">
                                                                                             <asp:Label ID="Label154" runat="server" Text="Notes"></asp:Label>
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                             <telerik:RadTextBox ID="txtcomment0" Runat="server" Font-Size="Medium" 
                                                                                                 Height="50px" Skin="Sunset" TextMode="MultiLine" Width="450px">
                                                                                             </telerik:RadTextBox>
                                                                                         </td>
                                                                                         <td style="width: 155px; height: 35px;">
                                                                                             &nbsp;</td>
                                                                                         <td style="height: 35px">
                                                                                             &nbsp;</td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td style="width: 139px; height: 35px;">
                                                                                             &nbsp;</td>
                                                                                         <td style="height: 35px">
                                                                                             <telerik:RadButton ID="btnupload0" runat="server" Skin="Simple" Text="Upload" 
                                                                                                 Width="148px">
                                                                                             </telerik:RadButton>
                                                                                             &nbsp;
                                                                                         </td>
                                                                                         <td style="width: 155px; height: 35px;">
                                                                                             <asp:HiddenField ID="HiddenField2" runat="server" />
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td colspan="4" style="height: 35px;">
                                                                                             <asp:Label ID="lblupload0" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                                                                 ForeColor="Red"></asp:Label>
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td colspan="4" style="height: 35px;">
                                                                                             &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                                                             <telerik:RadButton ID="btnsubmit0" runat="server" Skin="Simple" Text="Forward" 
                                                                                                 Width="204px">
                                                                                             </telerik:RadButton>
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td colspan="4">
                                                                                             <asp:Panel ID="Panel36" runat="server" Height="100%" ScrollBars="Both" 
                                                                                                 Width="100%">
                                                                                                 <telerik:RadGrid ID="GDNOTES0" runat="server" AllowPaging="True" 
                                                                                                     CellSpacing="0" GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                                                                     <MasterTableView AutoGenerateColumns="False">
                                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                                         <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                                         </RowIndicatorColumn>
                                                                                                         <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                                         </ExpandCollapseColumn>
                                                                                                         <Columns>
                                                                                                             <telerik:GridBoundColumn DataField="Note_date" 
                                                                                                                 FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                                                                                 ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                                                                                 <ItemStyle Width="100px" />
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="File_No" 
                                                                                                                 FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                                                                 ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                                                                                 <ItemStyle Width="50px" />
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="Note_From" 
                                                                                                                 FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                                                                                 ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                                                                                 <ItemStyle Width="100px" />
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="Notes" 
                                                                                                                 FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                                                                                 SortExpression="Notes" UniqueName="Notes">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                         </Columns>
                                                                                                         <EditFormSettings>
                                                                                                             <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                                             </EditColumn>
                                                                                                         </EditFormSettings>
                                                                                                     </MasterTableView>
                                                                                                     <ItemStyle Wrap="False" />
                                                                                                     <FilterMenu EnableImageSprites="False">
                                                                                                     </FilterMenu>
                                                                                                     <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                                     </HeaderContextMenu>
                                                                                                 </telerik:RadGrid>
                                                                                             </asp:Panel>
                                                                                         </td>
                                                                                     </tr>
                                                                                 </table>
                                                                             </asp:Panel>
                                                                         </td>
                                                                     </tr>
                                                                 </table>
                                                             </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V3" runat="server">
                                                             <asp:Panel ID="Panel29" runat="server">
                                                                 <table style="width: 100%">
                                                                     <tr>
                                                                         <td bgcolor="#999999">
                                                                             <asp:Label ID="Label148" runat="server" Text="Details"></asp:Label>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             &nbsp;</td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             <asp:Panel ID="Panel11" runat="server" Height="100%" ScrollBars="Both" 
                                                                                 Width="1128px">
                                                                                 <telerik:RadGrid ID="GDTracking" runat="server" AllowPaging="True" 
                                                                                     CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Sunset" 
                                                                                     Width="100%">
                                                                                     <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                         <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                             <HeaderStyle Width="20px" />
                                                                                         </RowIndicatorColumn>
                                                                                         <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                             <HeaderStyle Width="20px" />
                                                                                         </ExpandCollapseColumn>
                                                                                         <Columns>
                                                                                             <telerik:GridButtonColumn CommandName="Select" 
                                                                                                 FilterControlAltText="Filter Select column" HeaderText="Select" Text="Select" 
                                                                                                 UniqueName="Select">
                                                                                                 <HeaderStyle ForeColor="Blue" Width="100px" />
                                                                                                 <ItemStyle Width="50px" />
                                                                                             </telerik:GridButtonColumn>
                                                                                             <telerik:GridBoundColumn DataField="Receive_dt" 
                                                                                                 FilterControlAltText="Filter Receive_dt column" HeaderText="Receive_dt" 
                                                                                                 SortExpression="Receive_dt" UniqueName="Receive_dt">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="File_No" 
                                                                                                 FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                                 SortExpression="File_No" UniqueName="File_No">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                                                 FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                                                 SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Client_Type" 
                                                                                                 FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                                                 SortExpression="Client_Type" UniqueName="Client_Type">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Business_Type" 
                                                                                                 FilterControlAltText="Filter Business_Type column" HeaderText="Type" 
                                                                                                 SortExpression="Business_Type" UniqueName="Business_Type">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="File_Status" 
                                                                                                 FilterControlAltText="Filter File_Status column" HeaderText="Status" 
                                                                                                 SortExpression="File_Status" UniqueName="File_Status">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                                                 ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                                                 Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                                                 <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                                                 <ItemStyle CssClass="ButtonColumn" />
                                                                                             </telerik:GridButtonColumn>
                                                                                         </Columns>
                                                                                         <EditFormSettings>
                                                                                             <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                             </EditColumn>
                                                                                         </EditFormSettings>
                                                                                     </MasterTableView>
                                                                                     <ItemStyle Wrap="False" />
                                                                                     <FilterMenu EnableImageSprites="False">
                                                                                     </FilterMenu>
                                                                                     <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                     </HeaderContextMenu>
                                                                                 </telerik:RadGrid>
                                                                             </asp:Panel>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             <asp:Panel ID="Panel2" runat="server">
                                                                                 <table style="width: 99%">
                                                                                     <tr>
                                                                                         <td colspan="4">
                                                                                             <asp:Label ID="Label147" runat="server" Font-Bold="True" Text="Documentation"></asp:Label>
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td colspan="4">
                                                                                             <asp:Panel ID="Panel30" runat="server" Height="100%" ScrollBars="Both" 
                                                                                                 Width="1100px">
                                                                                                 <telerik:RadGrid ID="GD_DOCS" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                                                     GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                                                                     <MasterTableView AutoGenerateColumns="False" DataKeyNames="DOC_ID">
                                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                                         <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                                             <HeaderStyle Width="20px" />
                                                                                                         </RowIndicatorColumn>
                                                                                                         <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                                             <HeaderStyle Width="20px" />
                                                                                                         </ExpandCollapseColumn>
                                                                                                         <Columns>
                                                                                                             <telerik:GridBoundColumn DataField="DOC_ID" 
                                                                                                                 FilterControlAltText="Filter DOC_ID column" HeaderText="DOC_ID" 
                                                                                                                 SortExpression="DOC_ID" UniqueName="DOC_ID">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="File_No" 
                                                                                                                 FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                                                                 SortExpression="File_No" UniqueName="File_No">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="Doc_Title" 
                                                                                                                 FilterControlAltText="Filter Doc_Title column" HeaderText="Doc_Title" 
                                                                                                                 SortExpression="Doc_Title" UniqueName="Doc_Title">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="Doc_Date" 
                                                                                                                 FilterControlAltText="Filter Doc_Date column" HeaderText="Doc_Date" 
                                                                                                                 SortExpression="Doc_Date" UniqueName="Doc_Date">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="File_Name" 
                                                                                                                 FilterControlAltText="Filter File_Name column" HeaderText="File_Name" 
                                                                                                                 SortExpression="File_Name" UniqueName="File_Name">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="Upload_By" 
                                                                                                                 FilterControlAltText="Filter Upload_By column" HeaderText="Upload_By" 
                                                                                                                 SortExpression="Upload_By" UniqueName="Upload_By">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridButtonColumn ButtonType="ImageButton" CommandName="Delete" 
                                                                                                                 ConfirmText="Delete record?" FilterControlAltText="Filter DeleteColumn column" 
                                                                                                                 Resizable="false" Text="Delete" UniqueName="DeleteColumn">
                                                                                                                 <HeaderStyle CssClass="rgHeader ButtonColumnHeader" />
                                                                                                                 <ItemStyle CssClass="ButtonColumn" />
                                                                                                             </telerik:GridButtonColumn>
                                                                                                         </Columns>
                                                                                                         <EditFormSettings>
                                                                                                             <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                                             </EditColumn>
                                                                                                         </EditFormSettings>
                                                                                                     </MasterTableView>
                                                                                                     <FilterMenu EnableImageSprites="False">
                                                                                                     </FilterMenu>
                                                                                                     <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                                     </HeaderContextMenu>
                                                                                                 </telerik:RadGrid>
                                                                                             </asp:Panel>
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td style="width: 139px">
                                                                                             <asp:Label ID="Label145" runat="server" Text="Document"></asp:Label>
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                             <telerik:RadComboBox ID="cbodoc" Runat="server" MarkFirstMatch="True" 
                                                                                                 Skin="Sunset" Width="250px">
                                                                                             </telerik:RadComboBox>
                                                                                         </td>
                                                                                         <td style="width: 155px; height: 35px;">
                                                                                             <asp:Label ID="DOC_ID" runat="server" 
                                                                                                 style="font-weight: 700; color: #CC0000; background-color: #FFFFFF" 
                                                                                                 Visible="False"></asp:Label>
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                             &nbsp;</td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td style="width: 139px">
                                                                                             <asp:Label ID="Label146" runat="server" Text="Document"></asp:Label>
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                             <asp:FileUpload ID="FL1" runat="server" Width="330px" />
                                                                                         </td>
                                                                                         <td style="width: 155px; height: 35px;">
                                                                                             <asp:Label ID="Label138" runat="server" Text="Upload Date"></asp:Label>
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                             <telerik:RadDatePicker ID="dtupload" Runat="server" Enabled="False" MinDate="" 
                                                                                                 Skin="Sunset">
                                                                                                 <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                                                     UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                                                 </Calendar>
                                                                                                 <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                                                 </DateInput>
                                                                                                 <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                                             </telerik:RadDatePicker>
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td style="width: 139px; height: 35px;">
                                                                                             <asp:Label ID="Label144" runat="server" Text="Notes"></asp:Label>
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                             <telerik:RadTextBox ID="txtcomment" Runat="server" Font-Size="Medium" 
                                                                                                 Height="50px" Skin="Sunset" TextMode="MultiLine" Width="450px">
                                                                                             </telerik:RadTextBox>
                                                                                         </td>
                                                                                         <td style="width: 155px; height: 35px;">
                                                                                             &nbsp;</td>
                                                                                         <td style="height: 35px">
                                                                                             &nbsp;</td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td style="width: 139px; height: 35px;">
                                                                                             &nbsp;</td>
                                                                                         <td style="height: 35px">
                                                                                             <telerik:RadButton ID="btnupload" runat="server" Skin="Simple" Text="Upload" 
                                                                                                 Width="148px">
                                                                                             </telerik:RadButton>
                                                                                             &nbsp;
                                                                                         </td>
                                                                                         <td style="width: 155px; height: 35px;">
                                                                                             <asp:HiddenField ID="HiddenField1" runat="server" />
                                                                                         </td>
                                                                                         <td style="height: 35px">
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td colspan="4" style="height: 35px;">
                                                                                             <asp:Label ID="lblupload" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                                                                 ForeColor="Red"></asp:Label>
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td colspan="4" style="height: 35px;">
                                                                                             &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                                                             <telerik:RadButton ID="btnsubmit" runat="server" Skin="Simple" Text="Forward" 
                                                                                                 Width="204px">
                                                                                             </telerik:RadButton>
                                                                                         </td>
                                                                                     </tr>
                                                                                     <tr>
                                                                                         <td colspan="4">
                                                                                             <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                                                                                 Width="100%">
                                                                                                 <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                                                     GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                                                                     <MasterTableView AutoGenerateColumns="False">
                                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                                         <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                                         </RowIndicatorColumn>
                                                                                                         <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                                         </ExpandCollapseColumn>
                                                                                                         <Columns>
                                                                                                             <telerik:GridBoundColumn DataField="Note_date" 
                                                                                                                 FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                                                                                 ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                                                                                 <ItemStyle Width="100px" />
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="File_No" 
                                                                                                                 FilterControlAltText="Filter File_No column" HeaderText="File No" 
                                                                                                                 ItemStyle-Width="50" SortExpression="File_No" UniqueName="File_No">
                                                                                                                 <ItemStyle Width="50px" />
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="Note_From" 
                                                                                                                 FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                                                                                 ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                                                                                 <ItemStyle Width="100px" />
                                                                                                             </telerik:GridBoundColumn>
                                                                                                             <telerik:GridBoundColumn DataField="Notes" 
                                                                                                                 FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                                                                                 SortExpression="Notes" UniqueName="Notes">
                                                                                                             </telerik:GridBoundColumn>
                                                                                                         </Columns>
                                                                                                         <EditFormSettings>
                                                                                                             <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                                             </EditColumn>
                                                                                                         </EditFormSettings>
                                                                                                     </MasterTableView>
                                                                                                     <ItemStyle Wrap="False" />
                                                                                                     <FilterMenu EnableImageSprites="False">
                                                                                                     </FilterMenu>
                                                                                                     <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                                     </HeaderContextMenu>
                                                                                                 </telerik:RadGrid>
                                                                                             </asp:Panel>
                                                                                         </td>
                                                                                     </tr>
                                                                                 </table>
                                                                             </asp:Panel>
                                                                         </td>
                                                                     </tr>
                                                                 </table>
                                                             </asp:Panel>
                                                        </telerik:RadPageView>
                                                    </telerik:RadMultiPage>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    &nbsp;</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        &nbsp;</td>
                                </tr>
                            </table>
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
</ContentTemplate>
          <Triggers>
        <asp:PostBackTrigger ControlID = "btnupload" />
          </Triggers>
          </asp:UpdatePanel>
</asp:Content>

