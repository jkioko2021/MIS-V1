<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Risk_Register_New.aspx.vb" Inherits="_Default" %>

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
                                            Text="RISK TRACKING" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GDDEPART" runat="server" AllowPaging="True" CellSpacing="0" 
                                                            GridLines="None" Height="100%" PageSize="20" Skin="Simple" Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="Id">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Depart_Code column" HeaderText="Select" 
                                                                        Text="Select" UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="50px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                    <telerik:GridBoundColumn DataField="Depart_Code" 
                                                                        FilterControlAltText="Filter Depart_Code column" 
                                                                        HeaderText="Depart_Code" SortExpression="Depart_Code" 
                                                                        UniqueName="Depart_Code">
                                                                    </telerik:GridBoundColumn>                                                                      
                                                                    <telerik:GridBoundColumn DataField="Period_From" 
                                                                        FilterControlAltText="Filter Period_From column" HeaderText="Period_From" 
                                                                        SortExpression="Period_From" UniqueName="Period_From">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Period_To" 
                                                                        FilterControlAltText="Filter Period_To column" HeaderText="Period_To" 
                                                                        SortExpression="Period_To" UniqueName="Period_To">
                                                                    </telerik:GridBoundColumn>

                                                                     <telerik:GridBoundColumn DataField="Department" 
                                                                        FilterControlAltText="Filter Department column" HeaderText="Department" 
                                                                        SortExpression="Department" UniqueName="Department">
                                                                    </telerik:GridBoundColumn>
                                                                     <telerik:GridBoundColumn DataField="Risk_Owner" 
                                                                        FilterControlAltText="Filter Risk_Owner column" HeaderText="Risk_Owner" 
                                                                        SortExpression="Risk_Owner" UniqueName="Risk_Owner">
                                                                    </telerik:GridBoundColumn>
                                                                        <telerik:GridBoundColumn DataField="Champion_Name" 
                                                                        FilterControlAltText="Filter Champion_Name column" HeaderText="Champion_Name" 
                                                                        SortExpression="Champion_Name" UniqueName="Champion_Name">
                                                                    </telerik:GridBoundColumn>
                                                                      <telerik:GridBoundColumn DataField="Status" 
                                                                        FilterControlAltText="Filter Status column" HeaderText="Status" 
                                                                        SortExpression="Status" UniqueName="Status">
                                                                    </telerik:GridBoundColumn>
                                                                           <telerik:GridBoundColumn DataField="Due_Date" 
                                                                        FilterControlAltText="Filter Due_Date column" HeaderText="Due_Date" 
                                                                        SortExpression="Due_Date" UniqueName="Due_Date">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <PagerStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Small" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <asp:Panel ID="Panel19" runat="server">
                                            <table style="width: 100%">
                                                <tr>
                                                    <td colspan="3">
                                                        <asp:Panel ID="Panel23" runat="server">
                                                            <table style="width: 100%">
                                                                <tr>
                                                                    <td colspan="4">
                                                                        <asp:Label ID="Label186" runat="server" Font-Bold="True" Text="RISK DETAILS"></asp:Label>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        <asp:Label ID="Label187" runat="server" Text="Risk owner"></asp:Label>
                                                                    </td>
                                                                    <td style="width: 72%">
                                                                        <telerik:RadComboBox ID="cboowner" Runat="server" Enabled="False" Skin="Sunset" 
                                                                            Width="250px">
                                                                        </telerik:RadComboBox>
                                                                    </td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        <asp:Label ID="Label182" runat="server" Text="Period From"></asp:Label>
                                                                    </td>
                                                                    <td style="width: 72%">
                                                                        <telerik:RadDatePicker ID="dtfrom" Runat="server" Enabled="False" MinDate="" 
                                                                            Skin="Sunset">
                                                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                            </Calendar>
                                                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                            </DateInput>
                                                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                        </telerik:RadDatePicker>
                                                                    </td>
                                                                    <td style="width: 3%">
                                                                        <asp:Label ID="LBLRISK" runat="server"></asp:Label>
                                                                    </td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        <asp:Label ID="Label183" runat="server" Text="Period To"></asp:Label>
                                                                    </td>
                                                                    <td style="width: 72%">
                                                                        <telerik:RadDatePicker ID="dtto" Runat="server" Enabled="False" MinDate="" 
                                                                            Skin="Sunset">
                                                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                            </Calendar>
                                                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                                            </DateInput>
                                                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                        </telerik:RadDatePicker>
                                                                    </td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        <asp:Label ID="Label164" runat="server" Text="Depart Objective"></asp:Label>
                                                                    </td>
                                                                    <td style="width: 72%">
                                                                        <telerik:RadComboBox ID="cboobjective" Runat="server" AllowCustomText="True" 
                                                                            MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                        </telerik:RadComboBox>
                                                                    </td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        <asp:Label ID="Label166" runat="server" Text="Risk category"></asp:Label>
                                                                    </td>
                                                                    <td style="width: 72%">
                                                                        <telerik:RadComboBox ID="cbocategory" Runat="server" AllowCustomText="True" 
                                                                            MarkFirstMatch="True" Skin="Sunset" Width="250px">
                                                                        </telerik:RadComboBox>
                                                                    </td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        <asp:Label ID="Label165" runat="server" Text="Risk Title"></asp:Label>
                                                                    </td>
                                                                    <td style="width: 72%">
                                                                        <telerik:RadTextBox ID="txttitle" Runat="server" Width="400px">
                                                                        </telerik:RadTextBox>
                                                                    </td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        <asp:Label ID="Label167" runat="server" Text="Risk Description"></asp:Label>
                                                                    </td>
                                                                    <td rowspan="2" style="width: 72%">
                                                                        <telerik:RadTextBox ID="txtdescr" Runat="server" Height="70px" Rows="3" 
                                                                            Skin="Sunset" TextMode="MultiLine" Width="400px">
                                                                        </telerik:RadTextBox>
                                                                    </td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        <asp:Label ID="Label169" runat="server" Text="Consequences"></asp:Label>
                                                                    </td>
                                                                    <td rowspan="2" style="width: 72%">
                                                                        <telerik:RadTextBox ID="txtconseq" Runat="server" Height="100px" Rows="3" 
                                                                            Skin="Sunset" TextMode="MultiLine" Width="500px">
                                                                        </telerik:RadTextBox>
                                                                    </td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px">
                                                                        &nbsp;</td>
                                                                    <td style="width: 72%">
                                                                        <asp:CheckBox ID="chkactive" runat="server" Text="Is Active" />
                                                                    </td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                    <td style="width: 3%">
                                                                        &nbsp;</td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" style="width: 338px; height: 24px;">
                                                                    </td>
                                                                    <td style="width: 72%; height: 24px;">
                                                                        <telerik:RadButton ID="btnsave" runat="server" Skin="Simple" Text="Save" 
                                                                            Width="146px">
                                                                        </telerik:RadButton>
                                                                        &nbsp;
                                                                        <telerik:RadButton ID="btnedit" runat="server" Skin="Simple" Text="Edit" 
                                                                            Width="100px">
                                                                        </telerik:RadButton>
                                                                        &nbsp;
                                                                        <telerik:RadButton ID="btnnew" runat="server" Skin="Simple" Text="New" 
                                                                            Width="100px">
                                                                        </telerik:RadButton>
                                                                    </td>
                                                                    <td style="width: 3%; height: 24px;">
                                                                    </td>
                                                                    <td style="width: 3%; height: 24px;">
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td class="style17" colspan="4">
                                                                        <asp:Panel ID="Panel17" runat="server" Height="100%" ScrollBars="Both" 
                                                                            Width="1142px">
                                                                            <telerik:RadGrid ID="GD_RISK" runat="server" AllowPaging="True" CellSpacing="0" 
                                                                                GridLines="None" Height="100%" PageSize="200" Skin="Simple" Width="100%">
                                                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="Risk_Id">
                                                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                        <HeaderStyle Width="20px" />
                                                                                    </RowIndicatorColumn>
                                                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                        <HeaderStyle Width="20px" />
                                                                                    </ExpandCollapseColumn>
                                                                                    <Columns>
                                                                                        <telerik:GridButtonColumn CommandName="Select" 
                                                                                            FilterControlAltText="Filter POLICY_CODE column" HeaderText="Select" 
                                                                                            Text="Select" UniqueName="Select">
                                                                                            <HeaderStyle ForeColor="Blue" Width="50px" />
                                                                                            <ItemStyle Width="50px" />
                                                                                        </telerik:GridButtonColumn>
                                                                                        <telerik:GridBoundColumn DataField="Risk_Id" 
                                                                                            FilterControlAltText="Filter Risk_Id column" HeaderText="Risk_Id" 
                                                                                            SortExpression="Risk_Id" UniqueName="Risk_Id">
                                                                                        </telerik:GridBoundColumn>
                                                                                        <telerik:GridBoundColumn DataField="Depart_Objective" 
                                                                                            FilterControlAltText="Filter Depart_Objective column" HeaderText="Objective" 
                                                                                            SortExpression="Depart_Objective" UniqueName="Depart_Objective">
                                                                                        </telerik:GridBoundColumn>
                                                                                        <telerik:GridBoundColumn DataField="Risk_Title" 
                                                                                            FilterControlAltText="Filter Risk_Title column" HeaderText="Risk_Title" 
                                                                                            SortExpression="Risk_Title" UniqueName="Risk_Title">
                                                                                        </telerik:GridBoundColumn>
                                                                                        <telerik:GridBoundColumn DataField="Risk_Category" 
                                                                                            FilterControlAltText="Filter Risk_Category column" HeaderText="Risk_Category" 
                                                                                            SortExpression="Risk_Category" UniqueName="Risk_Category">
                                                                                        </telerik:GridBoundColumn>
                                                                                        <telerik:GridBoundColumn DataField="Period_From" 
                                                                                            FilterControlAltText="Filter Period_From column" HeaderText="Period_From" 
                                                                                            SortExpression="Period_From" UniqueName="Period_From">
                                                                                        </telerik:GridBoundColumn>
                                                                                        <telerik:GridBoundColumn DataField="Period_To" 
                                                                                            FilterControlAltText="Filter Period_To column" HeaderText="Period_To" 
                                                                                            SortExpression="Period_To" UniqueName="Period_To">
                                                                                        </telerik:GridBoundColumn>
                                                                                  
                                                                                    
                                                                                    </Columns>
                                                                                    <EditFormSettings>
                                                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                        </EditColumn>
                                                                                    </EditFormSettings>
                                                                                </MasterTableView>
                                                                                <ItemStyle Wrap="False" />
                                                                                <PagerStyle Wrap="False" />
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
                                                <tr>
                                                    <td style="width: 90px; ">
                                                        &nbsp;</td>
                                                    <td style="height: 44px">
                                                        &nbsp; &nbsp;
                                                    </td>
                                                    <td style="height: 44px">
                                                        <asp:Label ID="lblsave" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                            ForeColor="Red"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="3">
                                                        <hr />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="height: 42px;" align="center" colspan="3">
                                                        &nbsp;<asp:Label ID="lblsubmit" runat="server" Font-Bold="True" 
                                                            Font-Size="Medium" ForeColor="Red"></asp:Label>
                                                    </td>
                                                </tr>
                                            </table>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        &nbsp;<asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
            </ContentTemplate>
     
            </asp:UpdatePanel>
</asp:Content>

